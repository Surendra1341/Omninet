package org.zemo.omninet.storage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateFolderRequest {
    @NotBlank(message = "Folder name cannot be blank")
    private String folderName;
    private String userEmail;
}
