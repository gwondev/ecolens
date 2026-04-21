package com.greeneye.backend.controller;

import com.greeneye.backend.entity.DisposalRecord;
import com.greeneye.backend.entity.Module;
import com.greeneye.backend.repository.DisposalRecordRepository;
import com.greeneye.backend.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class ModuleController {
    private final ModuleRepository moduleRepository;
    private final DisposalRecordRepository disposalRecordRepository;

    private static final Set<String> ALLOWED_MODULE_STATUS = Set.of("DEFAULT", "READY", "CHECK", "FULL");

    @GetMapping
    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    @PostMapping
    public Module createModule(@RequestBody Map<String, Object> body) {
        String serialNumber = body.get("serialNumber") == null ? null : body.get("serialNumber").toString().trim();
        if (serialNumber == null || serialNumber.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "serialNumber is required");
        }
        if (moduleRepository.findBySerialNumber(serialNumber).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "serialNumber already exists");
        }

        Module module = Module.builder()
                .serialNumber(serialNumber)
                .organization(stringOrDefault(body.get("organization"), "CHOSUN_IT"))
                .lat(doubleOrDefault(body.get("lat"), 35.1469))
                .lon(doubleOrDefault(body.get("lon"), 126.9228))
                .type(stringOrDefault(body.get("type"), "GENERAL"))
                .status("DEFAULT")
                .totalDisposalCount(Math.max(0, intOrDefault(body.get("totalDisposalCount"), 0)))
                .lastHeartbeat(LocalDateTime.now())
                .build();
        return moduleRepository.save(module);
    }

    @PostMapping("/seed")
    public Map<String, Object> seedModules() {
        if (moduleRepository.count() > 0) {
            return Map.of("seeded", false, "reason", "already exists");
        }

        Module g1 = Module.builder()
                .serialNumber("g1")
                .organization("CHOSUN_IT")
                .lat(35.1462000)
                .lon(126.9229000)
                .type("CAN")
                .status("DEFAULT")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(g1);

        Module g2 = Module.builder()
                .serialNumber("g2")
                .organization("CHOSUN_IT")
                .lat(35.1474000)
                .lon(126.9242000)
                .type("PET")
                .status("DEFAULT")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(g2);

        Module gjCan = Module.builder()
                .serialNumber("gj-rvm-can-01")
                .organization("GWANGJU_CITY")
                .lat(35.1598700)
                .lon(126.8526000)
                .type("CAN")
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(gjCan);

        Module gjPet = Module.builder()
                .serialNumber("gj-rvm-pet-01")
                .organization("GWANGJU_CITY")
                .lat(35.1466900)
                .lon(126.9222700)
                .type("PET")
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(gjPet);

        Module gjCan2 = Module.builder()
                .serialNumber("gj-rvm-can-02")
                .organization("GWANGJU_CITY")
                .lat(35.1541200)
                .lon(126.9137400)
                .type("CAN")
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(gjCan2);

        Module gjPet2 = Module.builder()
                .serialNumber("gj-rvm-pet-02")
                .organization("GWANGJU_CITY")
                .lat(35.1324800)
                .lon(126.9021600)
                .type("PET")
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(gjPet2);

        Module gjCan3 = Module.builder()
                .serialNumber("gj-rvm-can-03")
                .organization("GWANGJU_CITY")
                .lat(35.1786000)
                .lon(126.9114000)
                .type("CAN")
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(gjCan3);

        Module gjPet3 = Module.builder()
                .serialNumber("gj-rvm-pet-03")
                .organization("GWANGJU_CITY")
                .lat(35.1660200)
                .lon(126.8799500)
                .type("PET")
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
        moduleRepository.save(gjPet3);

        return Map.of(
                "seeded",
                true,
                "serialNumbers",
                List.of(
                        g1.getSerialNumber(),
                        g2.getSerialNumber(),
                        gjCan.getSerialNumber(),
                        gjPet.getSerialNumber(),
                        gjCan2.getSerialNumber(),
                        gjPet2.getSerialNumber(),
                        gjCan3.getSerialNumber(),
                        gjPet3.getSerialNumber()
                )
        );
    }

    private String stringOrDefault(Object raw, String fallback) {
        if (raw == null) return fallback;
        String value = raw.toString().trim();
        return value.isBlank() ? fallback : value;
    }

    private Double doubleOrDefault(Object raw, double fallback) {
        if (raw == null) return fallback;
        try {
            return Double.parseDouble(raw.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private Integer intOrDefault(Object raw, int fallback) {
        if (raw == null) return fallback;
        try {
            return Integer.parseInt(raw.toString().trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public Module updateModule(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

        if (body.containsKey("serialNumber")) {
            String sn = body.get("serialNumber").toString().trim();
            if (!sn.isBlank()) {
                moduleRepository.findBySerialNumber(sn).ifPresent(other -> {
                    if (!other.getId().equals(id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "serialNumber already exists");
                    }
                });
                module.setSerialNumber(sn);
            }
        }
        if (body.containsKey("organization") && body.get("organization") != null) {
            module.setOrganization(body.get("organization").toString().trim());
        }
        if (body.containsKey("lat")) {
            module.setLat(doubleOrDefault(body.get("lat"), module.getLat() != null ? module.getLat() : 35.1469));
        }
        if (body.containsKey("lon")) {
            module.setLon(doubleOrDefault(body.get("lon"), module.getLon() != null ? module.getLon() : 126.9228));
        }
        if (body.containsKey("type") && body.get("type") != null) {
            module.setType(body.get("type").toString().trim().toUpperCase());
        }
        if (body.containsKey("status") && body.get("status") != null) {
            String st = body.get("status").toString().trim().toUpperCase();
            if (!ALLOWED_MODULE_STATUS.contains(st)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "status must be one of: DEFAULT, READY, CHECK, FULL");
            }
            module.setStatus(st);
        }
        if (body.containsKey("totalDisposalCount")) {
            module.setTotalDisposalCount(
                    Math.max(
                            0,
                            intOrDefault(
                                    body.get("totalDisposalCount"),
                                    module.getTotalDisposalCount()
                            )
                    )
            );
        }
        module.setLastHeartbeat(LocalDateTime.now());
        return moduleRepository.save(module);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteModule(@PathVariable Long id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

        List<DisposalRecord> records = disposalRecordRepository.findByModule_Id(module.getId());
        for (DisposalRecord dr : records) {
            disposalRecordRepository.delete(dr);
        }
        moduleRepository.delete(module);
    }
}