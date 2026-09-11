package org.zemo.omninet.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoAnalyticsDto {
    private long totalTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long notStartedTasks;
    private double completionRate;
    private long completedToday;
    private long completedThisWeek;
    private long overdueCount;
    private int streakDays;

    @Builder.Default
    private Map<String, Long> priorityDistribution = new HashMap<>();

    @Builder.Default
    private Map<String, Long> tagDistribution = new HashMap<>();
}
