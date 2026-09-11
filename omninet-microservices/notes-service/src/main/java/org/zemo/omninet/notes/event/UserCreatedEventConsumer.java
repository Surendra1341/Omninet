package org.zemo.omninet.notes.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.zemo.omninet.common.event.KafkaTopics;
import org.zemo.omninet.common.event.UserCreatedEvent;
import org.zemo.omninet.notes.service.CategoryService;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserCreatedEventConsumer {

    private final CategoryService categoryService;

    @KafkaListener(topics = KafkaTopics.USER_CREATED, groupId = "notes-service-group")
    public void onUserCreated(UserCreatedEvent event) {
        log.info("Received UserCreatedEvent for user: {}, userId: {}", event.getEmail(), event.getUserId());
        try {
            categoryService.createDefaultCategoriesForUser(event.getUserId());
            log.info("Created default categories for user: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to create default categories for user {}: {}", event.getUserId(), e.getMessage(), e);
        }
    }
}
