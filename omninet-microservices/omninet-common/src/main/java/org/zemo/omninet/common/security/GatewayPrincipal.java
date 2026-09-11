package org.zemo.omninet.common.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.io.Serializable;

/**
 * Lightweight principal object created from gateway-injected headers.
 * Used as the principal in Spring Security's Authentication context.
 */
@Getter
@AllArgsConstructor
public class GatewayPrincipal implements Serializable {

    private final String userId;
    private final String email;
    private final String name;

    @Override
    public String toString() {
        return "GatewayPrincipal{userId='" + userId + "', email='" + email + "'}";
    }
}
