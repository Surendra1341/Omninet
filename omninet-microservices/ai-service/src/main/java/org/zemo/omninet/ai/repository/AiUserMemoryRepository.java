package org.zemo.omninet.ai.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.ai.entity.AiUserMemory;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiUserMemoryRepository extends JpaRepository<AiUserMemory, Long> {
    List<AiUserMemory> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<AiUserMemory> findByUserIdAndMemoryKey(String userId, String memoryKey);
    void deleteByUserIdAndId(String userId, Long id);
}
