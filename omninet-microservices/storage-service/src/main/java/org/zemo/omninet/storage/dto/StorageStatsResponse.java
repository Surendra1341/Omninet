package org.zemo.omninet.storage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageStatsResponse {
    private long usedBytes;
    private long quotaBytes;
    private double usagePercentage;
    private int fileCount;
}
