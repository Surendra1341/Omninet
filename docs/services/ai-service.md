# AI Service

**Port:** `8084` (HTTP) · `9094` (gRPC)  
**Database:** `omninet_ai`  
**Providers:** Google Gemini (primary) + Ollama (fallback)

The AI service is the intelligence layer of OmniNet, powering a full-featured, Gemini-like conversational AI experience.

## Features

- **Multi-Session Chat** — Users can have multiple concurrent chat sessions, each with independent history.
- **Gemini Integration** — Primary AI provider using the Gemini REST API (`gemini-2.0-flash`).
- **Ollama Fallback** — Automatic failover to a local Ollama model when Gemini is unavailable.
- **SSE Streaming** — AI responses stream to the frontend token-by-token via Server-Sent Events.
- **Background Persistence** — Responses are persisted to the database even if the client disconnects mid-stream.
- **Web Search Tool Calling** — Gemini can call a web search tool and return source citations.
- **Conversation Memory** — Full message history is maintained per session and sent as context.
- **Voice Input (STT)** — Speech-to-text via browser `MediaRecorder` API.
- **Markdown Rendering** — Responses are rendered with full markdown and syntax-highlighted code blocks.
- **Message Editing** — Users can edit and resend messages, truncating history to that point.
- **Automatic Retry** — Exponential backoff on Gemini API failures before failover.

## REST API

### Chat Sessions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/chat/sessions` | List all sessions for user |
| `POST` | `/api/chat/sessions` | Create a new session |
| `DELETE` | `/api/chat/sessions/{id}` | Delete a session |
| `GET` | `/api/chat/sessions/{id}/messages` | Get session message history |

### AI Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/chat/stream` | Send message, receive SSE stream |
| `POST` | `/api/ai/chat` | Send message, receive full response (non-streaming) |

## Streaming Response Format

The `/api/ai/chat/stream` endpoint uses `ResponseBodyEmitter` (SSE) and sends events:

```
data: Hello
data:  world
data: !
data: [DONE]
```

The frontend accumulates tokens and renders them progressively.

## AI Provider Architecture

```java
interface AiProvider {
    String chat(List<Message> history, String userMessage);
    void chatStream(List<Message> history, String userMessage, ResponseBodyEmitter emitter);
}
```

Providers:
- `GeminiAiProvider` — Primary. Uses Gemini REST API with function calling.
- `OllamaAiProvider` — Fallback. Uses local Ollama REST API.

Failover order:
1. `gemini-2.0-flash` (primary model)
2. `gemini-1.5-flash-latest` (secondary model)
3. Ollama (`llama3` or configured model)

## Gemini Tool Calling — Web Search

When the user asks a question that requires current information, Gemini calls the `webSearch` tool:

```json
{
  "name": "webSearch",
  "parameters": {
    "query": "latest Spring Boot release"
  }
}
```

The service executes the search, feeds results back to Gemini, and Gemini generates a response with inline source citations.

## Message Turn Alternation

Gemini requires strict alternation of `user` / `model` turns in the conversation history. The service enforces this by:
1. Filtering out consecutive same-role messages.
2. Always starting history with a `user` turn.
3. Appending the current user message as the final `user` turn before sending.

## Voice Input Pipeline

1. Browser records audio via `MediaRecorder` API.
2. Audio blob is sent to the AI service.
3. AI service transcribes via `SpeechServiceGrpc` (Python STT service).
4. Transcribed text is used as the chat message.

## Session Message Cache

The frontend maintains an **in-memory session message cache** (`Map<sessionId, Message[]>`). When switching sessions, cached messages are displayed instantly without waiting for the API response. Background fetches update the cache.
