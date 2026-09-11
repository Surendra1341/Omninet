package org.zemo.omninet.auth.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.zemo.omninet.common.event.KafkaTopics;
import org.zemo.omninet.common.event.UserCreatedEvent;
import org.zemo.omninet.common.event.UserUpdatedEvent;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishUserCreated(String userId, String email, String name, String provider, String avatarUrl) {
        UserCreatedEvent event = UserCreatedEvent.builder()
                .userId(userId)
                .email(email)
                .name(name)
                .provider(provider)
                .avatarUrl(avatarUrl)
                .timestamp(Instant.now())
                .eventType("USER_CREATED")
                .build();

        log.info("Publishing UserCreatedEvent for userId: {}, email: {}", userId, email);
        try {
            kafkaTemplate.send(KafkaTopics.USER_CREATED, userId, event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish UserCreatedEvent for userId {}: {}", userId, ex.getMessage(), ex);
                        } else {
                            log.info("Successfully published UserCreatedEvent for userId {} to topic {}",
                                    userId, KafkaTopics.USER_CREATED);
                        }
                    });
        } catch (Exception e) {
            log.error("Synchronous error sending UserCreatedEvent for userId {}: {}", userId, e.getMessage(), e);
        }
    }

    public void publishUserUpdated(String userId, String email, String name, String avatarUrl, String updatedFields) {
        UserUpdatedEvent event = UserUpdatedEvent.builder()
                .userId(userId)
                .email(email)
                .name(name)
                .avatarUrl(avatarUrl)
                .updatedFields(updatedFields)
                .timestamp(Instant.now())
                .eventType("USER_UPDATED")
                .build();

        log.info("Publishing UserUpdatedEvent for userId: {}", userId);
        try {
            kafkaTemplate.send(KafkaTopics.USER_UPDATED, userId, event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish UserUpdatedEvent for userId {}: {}", userId, ex.getMessage(), ex);
                        } else {
                            log.info("Successfully published UserUpdatedEvent for userId {} to topic {}",
                                    userId, KafkaTopics.USER_UPDATED);
                        }
                    });
        } catch (Exception e) {
            log.error("Synchronous error sending UserUpdatedEvent for userId {}: {}", userId, e.getMessage(), e);
        }
    }
}
