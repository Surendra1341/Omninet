package org.zemo.omninet.storage.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.zemo.omninet.common.event.FileEvent;
import org.zemo.omninet.common.event.KafkaTopics;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class FileEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishFileEvent(String userId, String filePath, long sizeBytes, FileEvent.Action action) {
        FileEvent event = FileEvent.builder()
                .userId(userId)
                .filePath(filePath)
                .sizeBytes(sizeBytes)
                .action(action)
                .timestamp(Instant.now())
                .eventType("FILE_EVENT")
                .build();

        log.info("Publishing FileEvent: action={}, path={}, userId={}", action, filePath, userId);
        kafkaTemplate.send(KafkaTopics.FILE_EVENTS, userId, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish FileEvent for path {}: {}", filePath, ex.getMessage(), ex);
                    }
                });
    }
}
