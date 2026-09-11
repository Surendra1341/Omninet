package org.zemo.omninet.gateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtValidator {

    @Value("${jwt.secret:omninet_super_secret_jwt_signing_key_that_is_at_least_256_bits_long_for_hmac_sha256}")
    private String secretKey;

    private final ReactiveStringRedisTemplate redisTemplate;

    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    public JwtValidator(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public Mono<Claims> validateAndGetClaims(String token) {
        return redisTemplate.hasKey(BLACKLIST_PREFIX + token)
                .onErrorReturn(false)
                .defaultIfEmpty(false)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        log.warn("Rejected blacklisted token at gateway");
                        return Mono.error(new JwtException("Token is revoked"));
                    }
                    try {
                        Claims claims = Jwts.parser()
                                .verifyWith(getSigningKey())
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();

                        if (claims.getExpiration().before(new Date())) {
                            return Mono.error(new JwtException("Token expired"));
                        }
                        return Mono.just(claims);
                    } catch (Exception e) {
                        log.warn("JWT validation failed at gateway: {}", e.getMessage());
                        return Mono.error(new JwtException("Invalid token: " + e.getMessage()));
                    }
                });
    }
}
