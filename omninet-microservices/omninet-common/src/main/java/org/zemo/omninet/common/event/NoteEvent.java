package org.zemo.omninet.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kafka event published when a note is created or updated.
 * Used for audit logging and future analytics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteEvent {

    public enum Action { CREATED, UPDATED, SOFT_DELETED, RESTORED, HARD_DELETED, COPIED }

    private Integer noteId;
    private String userId;
    private String title;
    private String categoryName;
    private Action action;
    private boolean hasAttachment;

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private String eventType = "NOTE_EVENT";
}
