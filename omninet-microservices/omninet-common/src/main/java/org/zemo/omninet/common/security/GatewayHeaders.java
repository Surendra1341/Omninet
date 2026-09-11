package org.zemo.omninet.common.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

/**
 * Utility for extracting user identity from gateway-injected HTTP headers.
 * <p>
 * The API Gateway validates the JWT and injects these headers into all
 * authenticated requests before forwarding to downstream services:
 * <ul>
 *   <li>{@code X-User-Id} — the user's unique identifier</li>
 *   <li>{@code X-User-Email} — the user's email address</li>
 *   <li>{@code X-User-Name} — the user's display name</li>
 *   <li>{@code X-User-Roles} — comma-separated list of roles</li>
 * </ul>
 * <p>
 * Downstream services MUST NOT trust these headers from external clients.
 * The gateway strips any externally-provided X-User-* headers before adding its own.
 */
@Slf4j
@UtilityClass
public class GatewayHeaders {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_USER_EMAIL = "X-User-Email";
    public static final String HEADER_USER_NAME = "X-User-Name";
    public static final String HEADER_USER_ROLES = "X-User-Roles";

    /**
     * Extracts the authenticated user's ID from gateway headers.
     *
     * @param request the incoming HTTP request
     * @return the user ID
     * @throws IllegalStateException if the header is missing (unauthenticated request reached a protected endpoint)
     */
    public static String getUserId(HttpServletRequest request) {
        return getRequiredHeader(request, HEADER_USER_ID);
    }

    /**
     * Extracts the authenticated user's email from gateway headers.
     */
    public static String getUserEmail(HttpServletRequest request) {
        return getRequiredHeader(request, HEADER_USER_EMAIL);
    }

    /**
     * Extracts the authenticated user's display name from gateway headers.
     */
    public static String getUserName(HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader(HEADER_USER_NAME))
                .orElse("Unknown");
    }

    /**
     * Extracts the authenticated user's roles from gateway headers.
     *
     * @return array of role strings, empty array if no roles header
     */
    public static String[] getUserRoles(HttpServletRequest request) {
        String roles = request.getHeader(HEADER_USER_ROLES);
        if (roles == null || roles.isBlank()) {
            return new String[0];
        }
        return roles.split(",");
    }

    /**
     * Checks if the request has valid gateway authentication headers.
     */
    public static boolean isAuthenticated(HttpServletRequest request) {
        String userId = request.getHeader(HEADER_USER_ID);
        String userEmail = request.getHeader(HEADER_USER_EMAIL);
        return userId != null && !userId.isBlank()
                && userEmail != null && !userEmail.isBlank();
    }

    private static String getRequiredHeader(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isBlank()) {
            log.error("Missing required gateway header: {}. This likely means the request bypassed the gateway.", headerName);
            throw new IllegalStateException("Missing required authentication header: " + headerName);
        }
        return value;
    }
}
