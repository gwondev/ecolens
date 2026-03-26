package com.greeneye.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @PostMapping("/analyze")
    public Map<String, Object> analyze(@RequestBody Map<String, String> body) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Gemini API key is not configured");
        }

        // MVP 단계: 실제 Gemini 호출 대신 입력값 기반 임시 분류
        String hint = body.getOrDefault("hint", "").toLowerCase();
        String predictedType = "GENERAL";
        if (hint.contains("can") || hint.contains("캔")) predictedType = "CAN";
        if (hint.contains("pet") || hint.contains("plastic") || hint.contains("플라")) predictedType = "PET";

        return Map.of("predictedType", predictedType, "model", "gemini-1.5-flash");
    }
}
