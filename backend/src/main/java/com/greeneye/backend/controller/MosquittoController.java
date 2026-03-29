package com.greeneye.backend.controller;

import com.greeneye.backend.service.MqttTrafficLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mosquitto")
@RequiredArgsConstructor
public class MosquittoController {
    private final MqttTrafficLogService mqttTrafficLogService;

    @GetMapping("/logs")
    public List<Map<String, Object>> logs(@RequestParam(defaultValue = "20") int limit) {
        return mqttTrafficLogService.latest(limit);
    }
}
