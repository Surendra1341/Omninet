package org.zemo.omninet.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotesResponse {
    private List<NotesDto> notes;
    private long totalElements;
    private int totalPages;
    private int pageNumber;
    private int pageSize;
    private boolean isFirst;
    private boolean isLast;
}
