package org.zemo.omninet.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Standardized pagination response wrapper.
 * Replaces the old NotesResponse and provides a consistent pagination
 * structure for all paginated endpoints across services.
 *
 * @param <T> The type of items in the page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PageResponse<T> {

    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean hasNext;
    private boolean hasPrevious;

    /**
     * Creates a PageResponse from Spring Data Page metadata.
     */
    public static <T> PageResponse<T> of(List<T> content, int page, int size,
                                          long totalElements, int totalPages,
                                          boolean first, boolean last) {
        return PageResponse.<T>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .first(first)
                .last(last)
                .hasNext(!last)
                .hasPrevious(!first)
                .build();
    }
}
