package org.zemo.omninet.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileInfoResponse {
    private String id;
    private String name;
    private String fullPath;
    private long sizeBytes;
    private long lastModifiedEpochMs;
    private boolean isFolder;
    private String contentType;
    private String downloadUrl;
}
