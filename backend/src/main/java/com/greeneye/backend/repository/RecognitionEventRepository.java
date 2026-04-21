package com.greeneye.backend.repository;

import com.greeneye.backend.entity.RecognitionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecognitionEventRepository extends JpaRepository<RecognitionEvent, Long> {
    List<RecognitionEvent> findTop300ByOrderByCreatedAtDesc();
}
