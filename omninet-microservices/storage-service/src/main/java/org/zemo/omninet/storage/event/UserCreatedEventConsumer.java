package org.zemo.omninet.storage.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.zemo.omninet.common.event.KafkaTopics;
import org.zemo.omninet.common.event.UserCreatedEvent;
import org.zemo.omninet.storage.service.S3StorageService;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserCreatedEventConsumer {

    private final S3StorageService storageService;

    @KafkaListener(topics = KafkaTopics.USER_CREATED, groupId = "storage-service-group")
    public void onUserCreated(UserCreatedEvent event) {
        log.info("Received UserCreatedEvent for user: {}, email: {}", event.getUserId(), event.getEmail());
        try {
            String userEmail = event.getEmail();
            storageService.provisionUserFolders(event.getUserId(), userEmail);
            log.info("Successfully provisioned storage folders for user {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to provision storage folders for user {}: {}", event.getEmail(), e.getMessage(), e);
        }
    }
}
