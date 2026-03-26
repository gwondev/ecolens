package com.greeneye.backend.controller;

import com.greeneye.backend.entity.User;
import com.greeneye.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final UserRepository userRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @PostMapping("/analyze")
    public Map<String, Object> analyze(@RequestBody Map<String, String> body) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gemini API key is not configured");
        }

        String oauthId = body.get("oauthId");
        if (oauthId == null || oauthId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "oauthId is required");
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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

        user.setCameraDailyCount(user.getCameraDailyCount() + 1);
        user.setLastCameraAt(now);
        userRepository.save(user);

        // MVP 단계: 실제 Gemini 호출 대신 입력값 기반 임시 분류
        String hint = body.getOrDefault("hint", "").toLowerCase();
        String predictedType = "GENERAL";
        if (hint.contains("can") || hint.contains("캔")) predictedType = "CAN";
        if (hint.contains("pet") || hint.contains("plastic") || hint.contains("플라")) predictedType = "PET";

        Map<String, Object> result = new HashMap<>();
        result.put("predictedType", predictedType);
        result.put("model", "gemini-1.5-flash");
        result.put("cameraDailyCount", user.getCameraDailyCount());
        result.put("remainingToday", 10 - user.getCameraDailyCount());
        return result;
    }
}
