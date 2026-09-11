package org.zemo.omninet.common.event;

/**
 * Kafka topic constants shared across all services.
 * Centralizes topic names to prevent typos and maintain consistency.
 */
public final class KafkaTopics {

    private KafkaTopics() {
        // Utility class — no instantiation
    }

    /** Published by auth-service when a new user registers */
    public static final String USER_CREATED = "omninet.user.created";

    /** Published by auth-service when a user profile is updated */
    public static final String USER_UPDATED = "omninet.user.updated";

    /** Published by notes-service for note lifecycle events */
    public static final String NOTE_EVENTS = "omninet.note.events";

    /** Published by notes-service for todo reminder triggers */
    public static final String TODO_REMINDERS = "omninet.todo.reminders";

    /** Published by storage-service for file operation events */
    public static final String FILE_EVENTS = "omninet.file.events";

    /** Published by ai-service for AI interaction audit events */
    public static final String AI_EVENTS = "omninet.ai.events";
}
