package org.zemo.omninet.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.auth.model.User;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private String id;
    private String email;
    private String name;
    private String avatarUrl;
    private String provider;
    private String linkedProviders;
    private boolean accountMerged;
    private boolean emailVerified;
    private String registrationSource;
    private String roles;
    private Long storageQuotaBytes;
    private Long usedStorageBytes;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .provider(user.getProvider())
                .linkedProviders(user.getLinkedProviders())
                .accountMerged(user.isAccountMerged())
                .emailVerified(user.isEmailVerified())
                .registrationSource(user.getRegistrationSource())
                .roles(user.getRoles())
                .storageQuotaBytes(user.getStorageQuotaBytes())
                .usedStorageBytes(user.getUsedStorageBytes())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
