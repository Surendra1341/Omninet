package org.zemo.omninet.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckMethodsResponse {
    private boolean emailPassword;
    private boolean oauth;
    private List<String> providers;
    private boolean canRegister;
    private boolean accountExists;
}
