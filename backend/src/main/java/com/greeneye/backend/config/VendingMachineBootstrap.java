package com.greeneye.backend.config;

import com.greeneye.backend.entity.Module;
import com.greeneye.backend.repository.ModuleRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class VendingMachineBootstrap {

    private final ModuleRepository moduleRepository;

    @PostConstruct
    public void ensureVendingMachines() {
        List<Module> defaults = List.of(
                vm("gj-vm-can-01", 35.1598700, 126.8526000, "CAN"),
                vm("gj-vm-pet-01", 35.1466900, 126.9222700, "PET"),
                vm("gj-vm-can-02", 35.1541200, 126.9137400, "CAN"),
                vm("gj-vm-pet-02", 35.1324800, 126.9021600, "PET"),
                vm("gj-vm-can-03", 35.1786000, 126.9114000, "CAN"),
                vm("gj-vm-pet-03", 35.1660200, 126.8799500, "PET"),
                vm("gj-vm-can-04", 35.1483100, 126.9052000, "CAN"),
                vm("gj-vm-pet-04", 35.1419200, 126.9305000, "PET"),
                vm("gj-vm-can-05", 35.1715400, 126.8896100, "CAN"),
                vm("gj-vm-pet-05", 35.1577300, 126.9441200, "PET")
        );

        defaults.forEach(machine -> {
            if (moduleRepository.findBySerialNumber(machine.getSerialNumber()).isEmpty()) {
                moduleRepository.save(machine);
            }
        });
    }

    private Module vm(String serial, double lat, double lon, String type) {
        return Module.builder()
                .serialNumber(serial)
                .organization("GWANGJU_CITY")
                .lat(lat)
                .lon(lon)
                .type(type)
                .status("READY")
                .totalDisposalCount(0)
                .lastHeartbeat(LocalDateTime.now())
                .build();
    }
}
