package com.greeneye.backend.repository;

import com.greeneye.backend.entity.DisposalRecord;
import com.greeneye.backend.entity.Module;
import com.greeneye.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DisposalRecordRepository extends JpaRepository<DisposalRecord, Long> {
    // 특정 사용자의 배출 기록 리스트 가져오기
    List<DisposalRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<DisposalRecord> findFirstByUserAndModuleAndStatusOrderByCreatedAtDesc(User user, Module module, String status);
}