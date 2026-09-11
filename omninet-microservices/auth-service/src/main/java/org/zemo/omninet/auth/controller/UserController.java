package org.zemo.omninet.auth.controller;

import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.zemo.omninet.auth.config.CustomUserDetails;
import org.zemo.omninet.auth.dto.UserDto;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.service.UserService;
import org.zemo.omninet.common.dto.ApiResponse;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/users", "/api/users"})
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest request) {

        String userId = userDetails != null && userDetails.getUser() != null
                ? userDetails.getUser().getId()
                : org.zemo.omninet.common.security.GatewayHeaders.getUserId(request);

        String userEmail = userDetails != null && userDetails.getUser() != null
                ? userDetails.getUser().getEmail()
                : org.zemo.omninet.common.security.GatewayHeaders.getUserEmail(request);

        User user = null;
        if (userId != null && !userId.isBlank()) {
            try {
                user = userService.getUserById(userId);
            } catch (Exception ignored) {}
        }
        if (user == null && userEmail != null && !userEmail.isBlank()) {
            try {
                user = userService.getUserByEmail(userEmail);
            } catch (Exception ignored) {}
        }

        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }

        return ResponseEntity.ok(ApiResponse.success(UserDto.fromEntity(user), "Profile retrieved"));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UpdateProfileRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        String userId = userDetails != null && userDetails.getUser() != null
                ? userDetails.getUser().getId()
                : org.zemo.omninet.common.security.GatewayHeaders.getUserId(httpRequest);

        if (userId == null || userId.isBlank()) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }

        UserDto updated = userService.updateProfile(
                userId,
                request.getName(),
                request.getAvatarUrl()
        );

        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable String userId) {
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(UserDto.fromEntity(user), "User found"));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = userService.getUsersByIds(List.of())
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved"));
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
        private String avatarUrl;
    }
}
