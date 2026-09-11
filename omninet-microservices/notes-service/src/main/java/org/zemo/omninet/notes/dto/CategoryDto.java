package org.zemo.omninet.notes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.notes.entity.Category;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private Integer id;

    @NotBlank(message = "Category name is required")
    private String name;

    private String description;
    private Boolean isActive;
    private String colorHex;

    public static CategoryDto fromEntity(Category entity) {
        if (entity == null) return null;
        return CategoryDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .colorHex(entity.getColorHex())
                .build();
    }
}
