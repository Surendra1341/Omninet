package org.zemo.omninet.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotesRequest {

    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Category ID is required")
    private Integer categoryId;

    @Builder.Default
    private Boolean isPinned = false;

    @Builder.Default
    private Boolean isFavorite = false;
}
