package org.zemo.omninet.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kafka event published when a file operation occurs in storage-service.
 * Used for audit logging.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileEvent {

    public enum Action { UPLOADED, DELETED, FOLDER_CREATED, FOLDER_DELETED }

    private String userId;
    private String filePath;
    private long sizeBytes;
    private Action action;

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Builder.Default
    private String eventType = "FILE_EVENT";
}
