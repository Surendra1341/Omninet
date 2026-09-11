package org.zemo.omninet.storage.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @JsonProperty("isFolder")
    private boolean isFolder;
    
    private String contentType;
    private String downloadUrl;
}
