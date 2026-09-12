package org.zemo.omninet.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_user_memories", indexes = {
        @Index(name = "idx_aum_user_id", columnList = "user_id"),
        @Index(name = "idx_aum_key", columnList = "memory_key")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiUserMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "memory_key", nullable = false)
    private String memoryKey;

    @Column(name = "memory_value", columnDefinition = "TEXT", nullable = false)
    private String memoryValue;

    @Column(name = "category")
    @Builder.Default
    private String category = "general";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
