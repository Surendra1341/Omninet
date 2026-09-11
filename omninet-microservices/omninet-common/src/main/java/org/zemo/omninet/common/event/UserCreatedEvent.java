package org.zemo.omninet.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kafka event published when a new user is created.
 * Consumed by:
 * - storage-service: to create user folders in S3
 * - notes-service: to create default categories for the user
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreatedEvent {

    private String userId;
    private String email;
    private String name;
    private String provider;       // "email", "google", "github"
    private String avatarUrl;

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private String eventType = "USER_CREATED";
}
