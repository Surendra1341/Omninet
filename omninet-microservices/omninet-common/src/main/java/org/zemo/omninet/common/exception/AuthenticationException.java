package org.zemo.omninet.common.exception;

/**
 * Thrown when an authentication or authorization issue occurs.
 * Results in HTTP 401 or 403.
 */
public class AuthenticationException extends RuntimeException {

    private final int statusCode;

    public AuthenticationException(String message) {
        super(message);
        this.statusCode = 401;
    }

    public AuthenticationException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() { return statusCode; }
}
