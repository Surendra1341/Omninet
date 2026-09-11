package org.zemo.omninet.notes.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.zemo.omninet.common.event.KafkaTopics;
import org.zemo.omninet.common.event.NoteEvent;

import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotesEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishNoteEvent(Integer noteId, String userId, String title, String categoryName,
                                 NoteEvent.Action action, boolean hasAttachment) {
        NoteEvent event = NoteEvent.builder()
                .noteId(noteId)
                .userId(userId)
                .title(title)
                .categoryName(categoryName)
                .action(action)
                .hasAttachment(hasAttachment)
                .timestamp(Instant.now())
                .eventType("NOTE_EVENT")
                .build();

        log.info("Publishing NoteEvent: action={}, noteId={}, userId={}", action, noteId, userId);
        kafkaTemplate.send(KafkaTopics.NOTE_EVENTS, userId, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish NoteEvent for note {}: {}", noteId, ex.getMessage(), ex);
                    }
                });
    }

    public void publishTodoReminder(Integer todoId, String userId, String title, String dueDate) {
        Map<String, Object> payload = Map.of(
                "todoId", todoId,
                "userId", userId,
                "title", title,
                "dueDate", dueDate != null ? dueDate : "",
                "timestamp", Instant.now().toString(),
                "eventType", "TODO_REMINDER"
        );

        log.info("Publishing TodoReminder for todoId={}, userId={}", todoId, userId);
        kafkaTemplate.send(KafkaTopics.TODO_REMINDERS, userId, payload);
    }
}
