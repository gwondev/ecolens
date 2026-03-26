package com.greeneye.backend.repository;

import com.greeneye.backend.entity.DisposalRecord;
import com.greeneye.backend.entity.RewardHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RewardHistoryRepository extends JpaRepository<RewardHistory, Long> {
    Optional<RewardHistory> findByDisposalRecord(DisposalRecord disposalRecord);
}