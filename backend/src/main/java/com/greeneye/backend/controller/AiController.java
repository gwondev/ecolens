package com.greeneye.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.greeneye.backend.entity.User;
import com.greeneye.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final UserRepository userRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String geminiModel;

    private static final String VISION_PROMPT = """
            대한민국 분리배출 관점에서 이미지의 주된 폐기물을 분류하라.
            첫 줄에는 아래 네 단어 중 정확히 하나만 출력하라: CAN, GENERAL, PET, HAZARD
            - CAN: 알루미늄·철 캔 등 금속 캔
            - GENERAL: 일반쓰레기(재활용·캔·페트에 해당하지 않는 경우)
            - PET: 페트병·플라스틱 병류(페트 위주)
            - HAZARD: 배터리, 스프레이캔, 유해·위험 폐기물로 보이는 경우
            둘째 줄부터는 한국어로 한 문장만 설명해도 된다.""";

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> analyzeMultipart(
            @RequestPart("image") MultipartFile image,
            @RequestPart("oauthId") String oauthId,
            @RequestPart(value = "userSelectedType", required = false) String userSelectedType
    ) throws Exception {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gemini API key is not configured");
        }
        if (image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image is required");
        }
        String oid = oauthId == null ? "" : oauthId.trim();
        if (oid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "oauthId is required");
        }

        User user = userRepository.findByOauthId(oid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        applyRateLimitOrThrow(user);

        String mime = Optional.ofNullable(image.getContentType()).filter(s -> !s.isBlank()).orElse("image/jpeg");
        String b64 = Base64.getEncoder().encodeToString(image.getBytes());

        Map<String, Object> inline = new LinkedHashMap<>();
        inline.put("mime_type", mime);
        inline.put("data", b64);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", VISION_PROMPT));
        parts.add(Map.of("inline_data", inline));

        Map<String, Object> content = new LinkedHashMap<>();
        content.put("parts", parts);

        Map<String, Object> reqBody = new LinkedHashMap<>();
        reqBody.put("contents", List.of(content));

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel
                + ":generateContent?key="
                + geminiApiKey;

        String raw;
        try {
            raw = webClientBuilder.build()
                    .post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(reqBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(120));
        } catch (WebClientResponseException e) {
            String body = e.getResponseBodyAsString();
            if (body != null && body.length() > 800) {
                body = body.substring(0, 800) + "…";
            }
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Gemini API 오류 HTTP " + e.getStatusCode().value() + ": " + (body != null && !body.isBlank() ? body : e.getMessage())
            );
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Gemini 호출 실패: " + e.getMessage()
            );
        }

        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini 응답이 비어 있습니다.");
        }

        JsonNode root = objectMapper.readTree(raw);
        String text = extractGeminiText(root);
        String predicted = normalizeTypeToken(text);

        commitCameraUsage(user);

        String normalizedUserPick = normalizeUserPick(userSelectedType);
        String finalType = normalizedUserPick != null ? normalizedUserPick : predicted;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("predictedType", predicted);
        result.put("userSelectedType", normalizedUserPick);
        result.put("finalType", finalType);
        result.put("model", geminiModel);
        result.put("rawSnippet", text != null && text.length() > 400 ? text.substring(0, 400) + "…" : text);
        result.put("cameraDailyCount", user.getCameraDailyCount());
        result.put("remainingToday", 10 - user.getCameraDailyCount());
        return result;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> analyzeJson(@RequestBody Map<String, String> body) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gemini API key is not configured");
        }

        String oauthId = body.get("oauthId");
        if (oauthId == null || oauthId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "oauthId is required");
        }

        User user = userRepository.findByOauthId(oauthId.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        applyRateLimitOrThrow(user);

        String hint = body.getOrDefault("hint", "").toLowerCase();
        String predictedType = "GENERAL";
        if (hint.contains("can") || hint.contains("캔")) {
            predictedType = "CAN";
        }
        if (hint.contains("pet") || hint.contains("plastic") || hint.contains("플라") || hint.contains("페트")) {
            predictedType = "PET";
        }
        if (hint.contains("hazard") || hint.contains("위험") || hint.contains("배터리")) {
            predictedType = "HAZARD";
        }

        commitCameraUsage(user);

        Map<String, Object> result = new HashMap<>();
        result.put("predictedType", predictedType);
        result.put("model", "hint-fallback");
        result.put("cameraDailyCount", user.getCameraDailyCount());
        result.put("remainingToday", 10 - user.getCameraDailyCount());
        return result;
    }

    @PostMapping(value = "/disposal-guide", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> disposalGuide(@RequestBody Map<String, Object> body) {
        String wasteTypeRaw = Objects.toString(body.get("wasteType"), "GENERAL");
        String wasteType = normalizeTypeToken(wasteTypeRaw);
        String latitude = Objects.toString(body.get("latitude"), "");
        String longitude = Objects.toString(body.get("longitude"), "");

        String locationHint = (latitude.isBlank() || longitude.isBlank())
                ? "위치 정보 없음"
                : ("위도 " + latitude + ", 경도 " + longitude);

        String prompt = """
                너는 한국의 분리배출 도우미다.
                사용자가 폐기물 사진을 촬영했고, 분류 결과와 현재 위치 정보가 제공된다.
                아래 형식으로 한국어로 간결하게 답하라.
                1) 배출 대상: 한 줄
                2) 배출 주의사항: 2~3줄
                3) 배출 방법: 번호 목록 3단계
                지역별 확인이 필요하다는 문구, 링크 확인 권유 문구, '확인이 필요' 같은 회피 문구는 쓰지 마라.
                한국에서 통용되는 일반적인 분리배출 기준을 아는 전문가처럼 단정형 문장으로 안내하라.
                마크다운 서식(**, ##, -, *)은 사용하지 말고 일반 텍스트로만 작성하라.
                과장 없이 실천 가능한 안내를 하라.

                분류: %s
                위치: %s
                """.formatted(wasteType, locationHint);

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("wasteType", wasteType);
            fallback.put("guide", fallbackGuide(wasteType, locationHint));
            return fallback;
        }

        try {
            Map<String, Object> reqBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    )
            );
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + geminiModel
                    + ":generateContent?key="
                    + geminiApiKey;

            String raw = webClientBuilder.build()
                    .post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(reqBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(60));

            JsonNode root = objectMapper.readTree(raw == null ? "" : raw);
            String text = extractGeminiText(root);
            if (text == null || text.isBlank()) {
                text = fallbackGuide(wasteType, locationHint);
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("wasteType", wasteType);
            result.put("guide", text.trim());
            return result;
        } catch (Exception e) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("wasteType", wasteType);
            fallback.put("guide", fallbackGuide(wasteType, locationHint));
            return fallback;
        }
    }

    private void applyRateLimitOrThrow(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        if (user.getCameraDailyDate() == null || !user.getCameraDailyDate().equals(today)) {
            user.setCameraDailyDate(today);
            user.setCameraDailyCount(0);
        }

        if (user.getLastCameraAt() != null) {
            long seconds = Duration.between(user.getLastCameraAt(), now).getSeconds();
            if (seconds < 60) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "촬영은 1분 간격으로 가능합니다.");
            }
        }

        if (user.getCameraDailyCount() >= 10) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "하루 촬영 한도(10회)를 초과했습니다.");
        }
    }

    private void commitCameraUsage(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        if (user.getCameraDailyDate() == null || !user.getCameraDailyDate().equals(today)) {
            user.setCameraDailyDate(today);
            user.setCameraDailyCount(0);
        }
        user.setCameraDailyCount(user.getCameraDailyCount() + 1);
        user.setLastCameraAt(now);
        userRepository.save(user);
    }

    private String extractGeminiText(JsonNode root) {
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return "";
        }
        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            return "";
        }
        JsonNode t = parts.get(0).path("text");
        return t.isMissingNode() ? "" : t.asText("");
    }

    private String normalizeTypeToken(String text) {
        if (text == null) {
            return "GENERAL";
        }
        String firstLine = text.trim().split("\\R", 2)[0].trim().toUpperCase(Locale.ROOT);
        if (firstLine.contains("HAZARD")) {
            return "HAZARD";
        }
        if (firstLine.contains("PET")) {
            return "PET";
        }
        if (firstLine.contains("CAN")) {
            return "CAN";
        }
        if (firstLine.contains("GENERAL")) {
            return "GENERAL";
        }
        return "GENERAL";
    }

    private String normalizeUserPick(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String u = raw.trim().toUpperCase(Locale.ROOT);
        return switch (u) {
            case "CAN", "GENERAL", "PET", "HAZARD" -> u;
            default -> null;
        };
    }

    private String fallbackGuide(String wasteType, String locationHint) {
        String target = switch (wasteType) {
            case "CAN" -> "캔류";
            case "PET" -> "페트/플라스틱 병류";
            case "HAZARD" -> "유해폐기물";
            default -> "일반쓰레기";
        };
        return """
                1) 배출 대상: %s
                2) 배출 주의사항:
                - 현재 위치 기준: %s
                - 내용물과 이물질을 제거한 뒤 배출하면 재활용 품질이 높아집니다.
                3) 배출 방법:
                1. 내용물을 비우고 이물질을 제거합니다.
                2. 재질별 기준에 맞게 분리합니다.
                3. 지정된 배출 시간과 장소에 맞춰 배출합니다.
                """.formatted(target, locationHint);
    }
}
