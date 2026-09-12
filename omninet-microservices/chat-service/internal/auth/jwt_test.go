package auth

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestJWTValidation(t *testing.T) {
	secret := "omninet_super_secret_jwt_signing_key_that_is_at_least_256_bits_long_for_hmac_sha256"
	validator := NewValidator(secret)

	// Create valid token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		UserID: "user-123",
		Email:  "test@example.com",
		Name:   "Test User",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	})
	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	// 1. Direct validation
	claims, err := validator.Validate(tokenStr)
	if err != nil {
		t.Fatalf("expected valid token, got error: %v", err)
	}
	if claims.UserID != "user-123" || claims.Email != "test@example.com" {
		t.Errorf("unexpected claims: %+v", claims)
	}

	// 2. Extract from Authorization Header
	req := httptest.NewRequest("GET", "/api/chat/conversations", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	claimsFromHeader, err := validator.ExtractFromRequest(req)
	if err != nil {
		t.Fatalf("expected valid token from header, got error: %v", err)
	}
	if claimsFromHeader.UserID != "user-123" {
		t.Errorf("expected user-123, got: %s", claimsFromHeader.UserID)
	}

	// 3. Extract from Query Param (for WebSockets)
	reqWS := httptest.NewRequest("GET", "/ws?token="+tokenStr, nil)
	claimsFromWS, err := validator.ExtractFromRequest(reqWS)
	if err != nil {
		t.Fatalf("expected valid token from query param, got error: %v", err)
	}
	if claimsFromWS.Email != "test@example.com" {
		t.Errorf("expected test@example.com, got: %s", claimsFromWS.Email)
	}

	// 4. Invalid token rejection
	_, err = validator.Validate("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token string")
	}
}
