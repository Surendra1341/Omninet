package org.zemo.omninet.ai.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.zemo.omninet.common.event.KafkaTopics;

import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishAiInteraction(String userId, Long sessionId, String action, String model) {
        Map<String, Object> event = Map.of(
                "userId", userId,
                "sessionId", sessionId != null ? sessionId : -1L,
                "action", action,
                "model", model != null ? model : "default",
                "timestamp", Instant.now().toString(),
                "eventType", "AI_EVENT"
        );

        log.info("Publishing AI event: userId={}, action={}, model={}", userId, action, model);
        kafkaTemplate.send(KafkaTopics.AI_EVENTS, userId, event);
    }
}
