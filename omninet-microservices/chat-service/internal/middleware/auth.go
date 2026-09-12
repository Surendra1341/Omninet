package middleware

import (
	"context"
	"net/http"

	"github.com/omninet/chat-service/internal/auth"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// Auth is an HTTP middleware that validates JWT tokens for REST endpoints.
func Auth(validator *auth.Validator) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := validator.ExtractFromRequest(r)
			if err != nil {
				http.Error(w, `{"error":"Unauthorized","message":"`+err.Error()+`"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ClaimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetClaims extracts the JWT claims from the request context.
// Returns nil if not present (i.e., route not protected by Auth middleware).
func GetClaims(r *http.Request) *auth.Claims {
	if claims, ok := r.Context().Value(ClaimsKey).(*auth.Claims); ok {
		return claims
	}
	return nil
}

// CORS returns an HTTP middleware that adds permissive CORS headers.
func CORS(allowedOrigins string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "3600")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
