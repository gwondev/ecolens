package com.greeneye.backend.controller;

import com.greeneye.backend.entity.DisposalRecord;
import com.greeneye.backend.entity.Module;
import com.greeneye.backend.entity.RewardHistory;
import com.greeneye.backend.entity.User;
import com.greeneye.backend.repository.DisposalRecordRepository;
import com.greeneye.backend.repository.ModuleRepository;
import com.greeneye.backend.repository.RewardHistoryRepository;
import com.greeneye.backend.repository.UserRepository;
import com.greeneye.backend.service.MqttPublisherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class ModuleController {
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final DisposalRecordRepository disposalRecordRepository;
    private final RewardHistoryRepository rewardHistoryRepository;
    private final MqttPublisherService mqttPublisherService;

    @GetMapping
    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    @PostMapping("/seed")
    public Map<String, Object> seedModules() {
        if (moduleRepository.count() > 0) {
            return Map.of("seeded", false, "reason", "already exists");
        }

        Module sample = Module.builder()
                .serialNumber("GE-MODULE-001")
                .organization("CHOSUN_IT")
                .lat(35.1469)
                .lon(126.9228)
                .type("CAN")
                .status("DEFAULT")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(sample);
        return Map.of("seeded", true, "serialNumber", sample.getSerialNumber());
    }

    @PostMapping("/{serialNumber}/ready")
    public Map<String, Object> ready(
            @PathVariable String serialNumber,
            @RequestBody Map<String, String> body
    ) {
        String nickname = body.get("userId");
        if (nickname == null || nickname.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId(nickname) is required");
        }

        Module module = moduleRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        module.setStatus("READY");
        module.setLastHeartbeat(LocalDateTime.now());
        moduleRepository.save(module);

        DisposalRecord record = DisposalRecord.builder()
                .user(user)
                .module(module)
                .predictedType(body.get("predictedType"))
                .selectedType(body.get("selectedType"))
                .imageUrl(body.get("imageUrl"))
                .rewardAmount(1)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        disposalRecordRepository.save(record);

        String topic = "greeneye/modules/" + serialNumber + "/cmd";
        String payload = "{\"action\":\"READY\",\"userid\":\"" + nickname + "\"}";
        mqttPublisherService.publish(topic, payload);

        return Map.of("ok", true, "moduleStatus", module.getStatus(), "recordId", record.getId());
    }

    @PostMapping("/{serialNumber}/check")
    public Map<String, Object> check(
            @PathVariable String serialNumber,
            @RequestBody Map<String, String> body
    ) {
        String nickname = body.get("userId");
        if (nickname == null || nickname.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId(nickname) is required");
        }

        Module module = moduleRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        DisposalRecord record = disposalRecordRepository
                .findFirstByUserAndModuleAndStatusOrderByCreatedAtDesc(user, module, "PENDING")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "No pending disposal found"));

        record.setStatus("SUCCESS");
        record.setVerifiedAt(LocalDateTime.now());
        record.setRewardAmount(1);
        disposalRecordRepository.save(record);

        user.setNowRewards(user.getNowRewards() + 1);
        user.setTotalRewards(user.getTotalRewards() + 1);
        userRepository.save(user);

        module.setTotalDisposalCount(module.getTotalDisposalCount() + 1);
        module.setStatus("CHECK");
        module.setLastHeartbeat(LocalDateTime.now());
        moduleRepository.save(module);

        RewardHistory history = rewardHistoryRepository.findByDisposalRecord(record)
                .orElseGet(() -> {
                    RewardHistory newHistory = new RewardHistory();
                    newHistory.setUser(user);
                    newHistory.setDisposalRecord(record);
                    return newHistory;
                });
        history.setPoints(1);
        history.setReason("분리배출 성공");
        rewardHistoryRepository.save(history);

        // CHECK 상태 반영 후 기본 상태로 복귀
        module.setStatus("DEFAULT");
        moduleRepository.save(module);

        return Map.of(
                "ok", true,
                "reward", 1,
                "nowRewards", user.getNowRewards(),
                "totalRewards", user.getTotalRewards()
        );
    }
}