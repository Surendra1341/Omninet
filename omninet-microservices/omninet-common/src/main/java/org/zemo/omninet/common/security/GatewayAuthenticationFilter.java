package org.zemo.omninet.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Security filter for downstream microservices that trusts gateway-injected headers.
 * <p>
 * This filter reads the {@code X-User-*} headers set by the API Gateway's JWT validation
 * filter and creates a Spring Security authentication context from them.
 * <p>
 * <b>Important:</b> This filter should ONLY be used by services behind the API Gateway.
 * The gateway must strip any externally-provided X-User-* headers before adding its own.
 */
@Slf4j
public class GatewayAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (GatewayHeaders.isAuthenticated(request)) {
            String userId = GatewayHeaders.getUserId(request);
            String userEmail = GatewayHeaders.getUserEmail(request);
            String userName = GatewayHeaders.getUserName(request);
            String[] roles = GatewayHeaders.getUserRoles(request);

            List<SimpleGrantedAuthority> authorities = Arrays.stream(roles)
                    .filter(role -> !role.isBlank())
                    .map(role -> new SimpleGrantedAuthority(role.trim()))
                    .toList();

            // If no roles provided, default to ROLE_USER
            if (authorities.isEmpty()) {
                authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
            }

            var principal = new GatewayPrincipal(userId, userEmail, userName);
            var authentication = new UsernamePasswordAuthenticationToken(
                    principal, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.trace("Gateway authentication set for user: {} ({})", userEmail, userId);
        }

        filterChain.doFilter(request, response);
    }
}
