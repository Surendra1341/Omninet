package org.zemo.omninet.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.notes.entity.FileDetails;
import org.zemo.omninet.notes.entity.Notes;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotesDto {
    private Integer id;
    private String title;
    private String description;
    private Integer categoryId;
    private String categoryName;
    private String categoryColor;
    private FileDetails fileDetails;
    private Boolean isPinned;
    private Boolean isFavorite;
    private Boolean isDeleted;
    private LocalDateTime deletedOn;
    private String createdBy;
    private LocalDateTime createdOn;
    private LocalDateTime updatedOn;

    public static NotesDto fromEntity(Notes entity) {
        if (entity == null) return null;
        return NotesDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .categoryColor(entity.getCategory() != null ? entity.getCategory().getColorHex() : null)
                .fileDetails(entity.getFileDetails())
                .isPinned(entity.getIsPinned())
                .isFavorite(entity.getIsFavorite())
                .isDeleted(entity.getIsDeleted())
                .deletedOn(entity.getDeletedOn())
                .createdBy(entity.getCreatedBy())
                .createdOn(entity.getCreatedOn())
                .updatedOn(entity.getUpdatedOn())
                .build();
    }
}
