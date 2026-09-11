package org.zemo.omninet.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kafka event published when a user profile is updated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdatedEvent {

    private String userId;
    private String email;
    private String name;
    private String avatarUrl;
    private String updatedFields;  // Comma-separated list of changed fields

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private String eventType = "USER_UPDATED";
}
