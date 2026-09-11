package org.zemo.omninet.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    private String provider; // "google", "github", "email"

    @Column(name = "linked_providers")
    private String linkedProviders; // comma-separated e.g. "email,google"

    @Column(name = "account_merged")
    @Builder.Default
    private boolean accountMerged = false;

    private String password; // BCrypt-hashed, nullable for pure OAuth users

    @Column(name = "email_verified")
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "registration_source")
    private String registrationSource; // "oauth" or "email"

    @Column(name = "roles")
    @Builder.Default
    private String roles = "ROLE_USER";

    @Column(name = "storage_quota_bytes")
    @Builder.Default
    private Long storageQuotaBytes = 5368709120L; // 5 GB default

    @Column(name = "used_storage_bytes")
    @Builder.Default
    private Long usedStorageBytes = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public static User fromOAuth(String email, String name, String avatarUrl, String provider) {
        LocalDateTime now = LocalDateTime.now();
        return User.builder()
                .id(UUID.randomUUID().toString())
                .email(email)
                .name(name != null && !name.isBlank() ? name : email.split("@")[0])
                .avatarUrl(avatarUrl)
                .provider(provider)
                .linkedProviders(provider)
                .accountMerged(false)
                .emailVerified(true)
                .registrationSource("oauth")
                .roles("ROLE_USER")
                .storageQuotaBytes(5368709120L)
                .usedStorageBytes(0L)
                .createdAt(now)
                .lastLoginAt(now)
                .build();
    }

    public static User fromEmailRegistration(String email, String name, String hashedPassword) {
        LocalDateTime now = LocalDateTime.now();
        return User.builder()
                .id(UUID.randomUUID().toString())
                .email(email)
                .name(name)
                .password(hashedPassword)
                .provider("email")
                .linkedProviders("email")
                .accountMerged(false)
                .emailVerified(true)
                .registrationSource("email")
                .roles("ROLE_USER")
                .storageQuotaBytes(5368709120L)
                .usedStorageBytes(0L)
                .createdAt(now)
                .lastLoginAt(now)
                .build();
    }

    public boolean hasPassword() {
        return password != null && !password.trim().isEmpty();
    }

    public boolean supportsOAuthProvider(String providerName) {
        return linkedProviders != null && linkedProviders.contains(providerName);
    }
}
