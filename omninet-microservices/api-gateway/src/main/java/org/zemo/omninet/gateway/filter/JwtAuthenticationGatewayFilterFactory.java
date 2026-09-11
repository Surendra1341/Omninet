package org.zemo.omninet.gateway.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;
import org.zemo.omninet.gateway.util.JwtValidator;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationGatewayFilterFactory
        extends AbstractGatewayFilterFactory<JwtAuthenticationGatewayFilterFactory.Config> {

    private final JwtValidator jwtValidator;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/api/v1/auth/login/**",
            "/api/auth/login/**",
            "/api/v1/auth/register/**",
            "/api/auth/register/**",
            "/api/v1/auth/check-methods",
            "/api/auth/check-methods",
            "/api/v1/auth/refresh-token",
            "/api/auth/refresh-token",
            "/api/v1/auth/verify-otp",
            "/api/auth/verify-otp",
            "/api/v1/auth/logout",
            "/api/auth/logout",
            "/oauth2/**",
            "/login/**",
            "/actuator/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**",
            "/ws/**"
    );

    public JwtAuthenticationGatewayFilterFactory(JwtValidator jwtValidator) {
        super(Config.class);
        this.jwtValidator = jwtValidator;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // Strip any incoming X-User-* headers from untrusted external clients
            ServerHttpRequest.Builder requestBuilder = request.mutate()
                    .headers(httpHeaders -> {
                        httpHeaders.remove(GatewayHeaders.HEADER_USER_ID);
                        httpHeaders.remove(GatewayHeaders.HEADER_USER_EMAIL);
                        httpHeaders.remove(GatewayHeaders.HEADER_USER_NAME);
                        httpHeaders.remove(GatewayHeaders.HEADER_USER_ROLES);
                    });

            // Check if endpoint is open
            boolean isOpen = OPEN_ENDPOINTS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));

            String token = extractToken(request);

            if (token == null) {
                if (isOpen) {
                    return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
                }
                log.warn("Missing JWT token for secured path: {}", path);
                return onError(exchange, "Authentication token required", HttpStatus.UNAUTHORIZED);
            }

            return jwtValidator.validateAndGetClaims(token)
                    .flatMap(claims -> {
                        String userId = claims.getSubject();
                        if (userId == null || userId.isBlank()) {
                            userId = claims.get("userId", String.class);
                        }
                        String email = claims.get("email", String.class);
                        if (email == null || email.isBlank()) {
                            email = claims.get("sub", String.class);
                        }
                        String name = claims.get("name", String.class);
                        String roles = claims.get("roles", String.class);

                        final String finalUserId = userId != null ? userId : "";
                        final String finalEmail = email != null ? email : "";
                        final String finalName = name != null ? name : "";
                        final String finalRoles = roles != null ? roles : "ROLE_USER";

                        ServerHttpRequest mutatedRequest = request.mutate()
                                .headers(httpHeaders -> {
                                    httpHeaders.remove(GatewayHeaders.HEADER_USER_ID);
                                    httpHeaders.remove(GatewayHeaders.HEADER_USER_EMAIL);
                                    httpHeaders.remove(GatewayHeaders.HEADER_USER_NAME);
                                    httpHeaders.remove(GatewayHeaders.HEADER_USER_ROLES);
                                    httpHeaders.set(GatewayHeaders.HEADER_USER_ID, finalUserId);
                                    httpHeaders.set(GatewayHeaders.HEADER_USER_EMAIL, finalEmail);
                                    httpHeaders.set(GatewayHeaders.HEADER_USER_NAME, finalName);
                                    httpHeaders.set(GatewayHeaders.HEADER_USER_ROLES, finalRoles);
                                })
                                .build();

                        log.info("Gateway authenticated {} request to {} for user: {} ({})",
                                request.getMethod(), path, finalEmail, finalUserId);
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    })
                    .onErrorResume(e -> {
                        if (isOpen) {
                            // If open endpoint had an expired/invalid optional token, still allow
                            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
                        }
                        log.warn("JWT validation failed for path {}: {}", path, e.getMessage());
                        return onError(exchange, "Invalid or expired token: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
                    });
        };
    }

    private String extractToken(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        HttpCookie cookie = request.getCookies().getFirst("accessToken");
        if (cookie != null && !cookie.getValue().isBlank()) {
            return cookie.getValue();
        }

        return null;
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiResponse<Void> apiResponse = ApiResponse.error(message);
        try {
            byte[] bytes = objectMapper.writeValueAsString(apiResponse).getBytes(StandardCharsets.UTF_8);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            log.error("Error serializing response: {}", e.getMessage());
            return response.setComplete();
        }
    }

    @Data
    public static class Config {
        // Configuration properties if needed in yaml
    }
}
