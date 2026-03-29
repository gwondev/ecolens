package com.greeneye.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModuleIotMqttHandler {

    private final ModuleDisposalService moduleDisposalService;
    private final ObjectMapper objectMapper;

    public void handleStatusPayload(String serialNumber, String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String status = root.path("status").asText("").trim().toUpperCase();
            if (status.isEmpty()) {
                log.warn("MQTT status empty serial={} payload={}", serialNumber, payload);
                return;
            }
            switch (status) {
                case "DEFAULT" -> moduleDisposalService.setModuleStatusDefault(serialNumber);
                case "READY" -> handleReadyTimeout(serialNumber, root);
                case "CHECK" -> handleCheck(serialNumber, root);
                default -> log.warn("MQTT unknown status serial={} status={}", serialNumber, status);
            }
        } catch (Exception e) {
            log.error("MQTT status parse/handle failed serial={} payload={}", serialNumber, payload, e);
        }
    }

    /** 10초 경과, 물리적으로 버리지 않음 — 로그만 FAILED, 리워드 없음 */
    private void handleReadyTimeout(String serialNumber, JsonNode root) {
        String nickname = nicknameFrom(root);
        if (nickname == null || nickname.isBlank()) {
            log.warn("MQTT READY timeout without nickname serial={}", serialNumber);
            return;
        }
        moduleDisposalService.failPendingDisposalTimeout(serialNumber, nickname);
    }

    private void handleCheck(String serialNumber, JsonNode root) {
        String nickname = nicknameFrom(root);
        if (nickname == null || nickname.isBlank()) {
            log.warn("MQTT CHECK without userId serial={}", serialNumber);
            return;
        }
        try {
            moduleDisposalService.completeDisposalCheck(serialNumber, nickname);
        } catch (ResponseStatusException ex) {
            log.warn("MQTT CHECK not applied serial={} reason={}", serialNumber, ex.getReason());
        } catch (Exception e) {
            log.error("MQTT CHECK failed serial={}", serialNumber, e);
        }
    }

    public void handleEventsPayload(String serialNumber, String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String ev = root.path("status").asText("").trim();
            if (ev.isEmpty()) {
                ev = root.path("event").asText("").trim();
            }
            if ("FULL".equalsIgnoreCase(ev)) {
                moduleDisposalService.setModuleStatusFull(serialNumber);
            } else {
                log.warn("MQTT unknown event serial={} payload={}", serialNumber, payload);
            }
        } catch (Exception e) {
            log.error("MQTT events parse/handle failed serial={} payload={}", serialNumber, payload, e);
        }
    }

    private static String nicknameFrom(JsonNode root) {
        String n = textOrNull(root, "userId");
        if (n == null) {
            n = textOrNull(root, "userid");
        }
        if (n == null) {
            n = textOrNull(root, "nickname");
        }
        return n;
    }

    private static String textOrNull(JsonNode root, String field) {
        if (!root.has(field)) {
            return null;
        }
        String t = root.get(field).asText("");
        return t.isBlank() ? null : t.trim();
    }
}
