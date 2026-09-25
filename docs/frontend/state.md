# State Management

OmniNet uses **Zustand** for client-side state management — a minimal, boilerplate-free alternative to Redux.

## Stores Overview

| Store | File | Responsibility |
|-------|------|---------------|
| `authStore` | `store/authStore.js` | User profile, tokens, login/logout |
| `notesStore` | `store/notesStore.js` | Notes list, search, filters, recycle bin |
| `todoStore` | `store/todoStore.js` | Todos, status, filters |
| `storageStore` | `store/storageStore.js` | File explorer state, folder path, quota |
| `chatStore` | `store/chatStore.js` | Chat sessions list |

## authStore

```js
{
  user: null | { id, email, firstName, lastName, avatarUrl },
  accessToken: null | string,
  isAuthenticated: boolean,

  // Actions
  login: (user, accessToken) => void,
  logout: () => void,
  updateUser: (user) => void,
  setAccessToken: (token) => void,
}
```

Token persistence: `accessToken` is kept in memory only (not localStorage) for XSS protection. Refresh tokens are stored in `httpOnly` cookies.

## notesStore

```js
{
  notes: [],
  selectedNote: null,
  searchQuery: '',
  selectedCategory: null,
  viewMode: 'grid' | 'list',
  isLoading: boolean,
  error: null | string,

  // Actions
  fetchNotes: () => Promise<void>,
  createNote: (data) => Promise<void>,
  updateNote: (id, data) => Promise<void>,
  deleteNote: (id) => Promise<void>,
  restoreNote: (id) => Promise<void>,
  setSearchQuery: (q) => void,
  setSelectedCategory: (cat) => void,
}
```

## useAiChat Hook

The AI chat uses a dedicated custom hook (`hooks/useAiChat.js`) rather than a Zustand store, because chat state is complex and session-local:

```js
const {
  sessions,          // ChatSession[]
  activeSessionId,   // string | null
  messages,          // Message[] for activeSession
  isStreaming,       // boolean
  sendMessage,       // (content: string) => void
  createSession,     // () => void
  deleteSession,     // (id: string) => void
  switchSession,     // (id: string) => void
  editMessage,       // (id: string, newContent: string) => void
} = useAiChat()
```

### In-Memory Session Cache

To allow instant session switching (even while streams are in progress), messages are cached in a `Map<sessionId, Message[]>` inside the hook. When switching sessions:

1. Current session messages are saved to the cache.
2. Cached messages for the target session are displayed immediately.
3. A background API fetch updates the cache with the latest persisted messages.

This means the user never sees a loading spinner when switching between sessions they've already visited.
