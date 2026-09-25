# Frontend Overview

**Tech Stack:** React 18 · Vite · TailwindCSS · DaisyUI · Zustand · GSAP · Lenis  
**Dev Port:** `5173`  
**API Target:** `http://localhost:8080` (API Gateway)

The `omninet-security-web` package is a Vite React SPA that connects to the reactive API Gateway.

## Technology Choices

| Library | Purpose |
|---------|---------|
| **React 18** | UI component framework |
| **Vite** | Build tool and dev server |
| **TailwindCSS + DaisyUI** | Utility CSS with pre-built components |
| **Zustand** | Lightweight state management |
| **Axios** | HTTP client with interceptors |
| **GSAP** | Purposeful UI animations |
| **Lenis** | Smooth-scroll with overflow-scroll compatibility |
| **ReactMarkdown** | Markdown rendering for AI responses |
| **react-syntax-highlighter** | Syntax-highlighted code blocks |
| **rehype-raw** | HTML-in-Markdown rendering |

## Project Structure

```
omninet-security-web/
├── src/
│   ├── api/               # Axios clients and API functions
│   │   ├── api.js         # All API calls (notes, todos, categories, AI)
│   │   ├── axiosInstance.js # Interceptors, token refresh queue
│   │   └── storageClient.js # Storage-specific helpers
│   ├── hooks/             # Custom React hooks
│   │   └── useAiChat.js   # AI chat session state machine
│   ├── pages/             # Route-level page components
│   │   ├── AiChat/        # Multi-session AI chat UI
│   │   ├── Notes/         # Notes list, create, edit
│   │   ├── Files/         # File explorer
│   │   ├── Category/      # Category management
│   │   ├── Login/         # Login & OAuth2 callback
│   │   ├── Register/      # Email registration & OTP
│   │   └── Dashboard/     # Summary dashboard
│   ├── store/             # Zustand stores
│   │   ├── authStore.js
│   │   ├── notesStore.js
│   │   ├── todoStore.js
│   │   ├── storageStore.js
│   │   └── chatStore.js
│   ├── components/        # Shared UI components
│   ├── App.jsx            # Router + Lenis initialization
│   └── main.jsx           # Entry point
```

## Axios Interceptors

The `axiosInstance.js` sets up:

1. **Request interceptor** — Attaches `Authorization: Bearer <access_token>` header.
2. **Response interceptor (401 handler)** — On 401:
   - Pauses all in-flight requests.
   - Calls `POST /api/v1/auth/refresh-token` with the refresh token cookie.
   - Retries all queued requests with the new access token.
   - Logs out on refresh failure.

## Smooth Scrolling — Lenis

Lenis is initialized globally in `App.jsx` with a `prevent` predicate:

```js
const lenis = new Lenis({
  prevent: (node) => node.hasAttribute('data-lenis-prevent'),
})
```

Any scrollable container inside modals or the AI chat list **must** have `data-lenis-prevent` to prevent Lenis from intercepting native overflow scroll.

## Design System

OmniNet uses a cohesive design system across all pages:

- **Color palette** — Indigo-violet primary, neutral dark backgrounds, no neon/glow effects.
- **Typography** — Inter (headings) + system fonts.
- **Cards** — Consistent border-radius, shadow, and hover lift.
- **Transitions** — 200ms ease-out on all interactive elements.
- **Empty/Loading/Error states** — Standardised across all pages.
