package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"go.uber.org/zap"

	"github.com/omninet/chat-service/internal/auth"
	"github.com/omninet/chat-service/internal/cache"
	"github.com/omninet/chat-service/internal/config"
	"github.com/omninet/chat-service/internal/db"
	"github.com/omninet/chat-service/internal/handlers"
	"github.com/omninet/chat-service/internal/hub"
	appMiddleware "github.com/omninet/chat-service/internal/middleware"
	"github.com/omninet/chat-service/internal/repository"
)

func main() {
	// ── Logger ───────────────────────────────────────────────────────────────
	log, err := zap.NewProduction()
	if err != nil {
		panic("failed to initialize logger: " + err.Error())
	}
	defer log.Sync()

	// ── Configuration ────────────────────────────────────────────────────────
	cfg := config.Load()
	log.Info("Starting OmniNet Chat Service", zap.String("port", cfg.Port))

	// ── Context with graceful shutdown ───────────────────────────────────────
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ── PostgreSQL ───────────────────────────────────────────────────────────
	pool, err := db.Connect(ctx, cfg.DatabaseURL, log)
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer pool.Close()

	// ── Redis ────────────────────────────────────────────────────────────────
	cacheClient, err := cache.Connect(cfg.RedisURL, log)
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer cacheClient.Close()

	// ── Repositories ─────────────────────────────────────────────────────────
	msgRepo := repository.NewMessageRepo(pool)
	convRepo := repository.NewConversationRepo(pool)
	presRepo := repository.NewPresenceRepo(pool)

	// ── JWT Validator ────────────────────────────────────────────────────────
	jwtValidator := auth.NewValidator(cfg.JWTSecret)

	// ── WebSocket Hub ────────────────────────────────────────────────────────
	chatHub := hub.New(log, cacheClient, pool, msgRepo, convRepo, presRepo)
	go chatHub.Run(ctx)

	// ── HTTP Handlers ────────────────────────────────────────────────────────
	wsHandler := handlers.NewWSHandler(chatHub, jwtValidator, log)
	convHandler := handlers.NewConversationHandler(convRepo, chatHub, log)
	msgHandler := handlers.NewMessageHandler(msgRepo, convRepo, chatHub, log)
	presHandler := handlers.NewPresenceHandler(presRepo, cacheClient, chatHub, log)

	// ── Router ───────────────────────────────────────────────────────────────
	r := chi.NewRouter()

	// Global middleware
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.RequestID)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.Timeout(30 * time.Second))
	r.Use(appMiddleware.CORS(cfg.AllowedOrigins))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"chat-service"}`))
	})

	// WebSocket endpoint — auth handled inside the handler (supports query param token for WS)
	r.Get("/ws", wsHandler.ServeHTTP)

	// Protected REST API
	r.Route("/api/chat", func(r chi.Router) {
		r.Use(appMiddleware.Auth(jwtValidator))

		// Conversations
		r.Get("/conversations", convHandler.List)
		r.Post("/conversations", convHandler.Create)
		r.Get("/conversations/{id}", convHandler.GetByID)
		r.Put("/conversations/{id}", convHandler.Update)
		r.Post("/conversations/{id}/members", convHandler.AddMember)
		r.Delete("/conversations/{id}/members/{userId}", convHandler.RemoveMember)

		// Messages within a conversation
		r.Get("/conversations/{id}/messages", msgHandler.List)
		r.Post("/conversations/{id}/read", msgHandler.MarkRead)

		// Message operations
		r.Put("/messages/{id}", msgHandler.Edit)
		r.Delete("/messages/{id}", msgHandler.Delete)
		r.Post("/messages/{id}/reactions", msgHandler.AddReaction)
		r.Delete("/messages/{id}/reactions/{emoji}", msgHandler.RemoveReaction)

		// Presence
		r.Get("/presence", presHandler.GetMultiple)
	})

	// ── HTTP Server ──────────────────────────────────────────────────────────
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Info("Chat service listening", zap.String("addr", server.Addr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server error", zap.Error(err))
		}
	}()

	// Wait for shutdown signal
	<-ctx.Done()
	log.Info("Shutting down chat service...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("Server shutdown error", zap.Error(err))
	}

	log.Info("Chat service stopped")
}
