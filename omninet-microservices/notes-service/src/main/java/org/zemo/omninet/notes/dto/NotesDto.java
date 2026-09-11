package org.zemo.omninet.notes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private CategoryDto category;
    private FileDetails fileDetails;
    private Boolean isPinned;
    private Boolean isFavorite;
    private Boolean isDeleted;
    private LocalDateTime deletedOn;
    private String createdBy;
    private LocalDateTime createdOn;
    private LocalDateTime updatedOn;

    @JsonProperty("createdDate")
    public LocalDateTime getCreatedDate() {
        return createdOn;
    }

    public static NotesDto fromEntity(Notes entity) {
        if (entity == null) return null;
        Integer catId = entity.getCategory() != null ? entity.getCategory().getId() : null;
        String catName = entity.getCategory() != null ? entity.getCategory().getName() : null;
        String catColor = entity.getCategory() != null ? entity.getCategory().getColorHex() : null;

        CategoryDto catDto = entity.getCategory() != null ? CategoryDto.fromEntity(entity.getCategory()) : null;
        if (catDto == null && (catId != null || catName != null)) {
            catDto = CategoryDto.builder()
                    .id(catId)
                    .name(catName != null ? catName : "General")
                    .colorHex(catColor != null ? catColor : "#6366f1")
                    .build();
        }

        return NotesDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .categoryId(catId)
                .categoryName(catName)
                .categoryColor(catColor)
                .category(catDto)
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
