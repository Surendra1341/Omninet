package auth

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the custom JWT claims used by omninet-auth-service.
// The token is HMAC-SHA256 signed with a shared secret.
type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Roles  string `json:"roles"`
	jwt.RegisteredClaims
}

// Validator validates JWTs using the shared secret.
type Validator struct {
	secret []byte
}

// NewValidator creates a JWT validator with the given HMAC-SHA256 secret.
func NewValidator(secret string) *Validator {
	return &Validator{secret: []byte(secret)}
}

// Validate parses and validates a token string, returning the claims.
func (v *Validator) Validate(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return v.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	// Ensure required fields are present
	if claims.UserID == "" || claims.Email == "" {
		return nil, errors.New("token missing required claims (userId or email)")
	}

	return claims, nil
}

// ExtractFromRequest extracts and validates the JWT from an HTTP request.
// Checks: Authorization: Bearer <token> header, then ?token= query param.
func (v *Validator) ExtractFromRequest(r *http.Request) (*Claims, error) {
	// 1. Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return nil, errors.New("invalid authorization header format")
		}
		return v.Validate(strings.TrimPrefix(authHeader, "Bearer "))
	}

	// 2. Query param (for WebSocket upgrade where headers are harder to set)
	if token := r.URL.Query().Get("token"); token != "" {
		return v.Validate(token)
	}

	return nil, errors.New("no authorization token provided")
}
