package org.zemo.omninet.notes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class NotesRequest {

    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Integer categoryId;

    @Builder.Default
    private Boolean isPinned = false;

    @Builder.Default
    private Boolean isFavorite = false;

    @Builder.Default
    private Boolean removeAttachment = false;

    @JsonProperty("category")
    public void setCategory(Object categoryObj) {
        if (categoryObj instanceof Map<?, ?> map) {
            Object idVal = map.get("id");
            if (idVal instanceof Number n) {
                this.categoryId = n.intValue();
            } else if (idVal instanceof String s) {
                try {
                    this.categoryId = Integer.parseInt(s);
                } catch (NumberFormatException ignored) {}
            }
        } else if (categoryObj instanceof Number n) {
            this.categoryId = n.intValue();
        }
    }
}
