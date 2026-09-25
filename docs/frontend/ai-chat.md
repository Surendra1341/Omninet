# AI Chat UI

The AI Chat page (`/ai-chat`) provides a Gemini/Claude-like conversational AI experience with multi-session support, streaming responses, markdown rendering, and voice input.

## Architecture

```
AiChat.jsx
├── SessionSidebar
│   ├── SessionList (sessions[])
│   └── NewSessionButton
├── ChatArea
│   ├── MessageList (messages[])
│   │   ├── UserMessage
│   │   └── AssistantMessage
│   │       ├── ReactMarkdown (with rehype-raw)
│   │       │   └── SyntaxHighlighter (code blocks)
│   │       └── SourceCitations (web search results)
│   └── StreamingIndicator
└── InputBar
    ├── TextInput (auto-resize)
    ├── VoiceButton (MediaRecorder → STT)
    └── SendButton
```

## Markdown Rendering

AI responses are rendered with `ReactMarkdown` using:
- `rehype-raw` — Allows HTML tags inside markdown (e.g., `<br>`, `<details>`).
- Custom `code` renderer — Detects language from fenced code blocks and applies `react-syntax-highlighter` with the `atomDark` theme.

```jsx
<ReactMarkdown
  rehypePlugins={[rehypeRaw]}
  components={{
    code({ inline, className, children }) {
      const language = /language-(\w+)/.exec(className || '')?.[1]
      return !inline && language ? (
        <SyntaxHighlighter style={atomDark} language={language}>
          {String(children)}
        </SyntaxHighlighter>
      ) : (
        <code className="inline-code">{children}</code>
      )
    },
  }}
/>
```

## Streaming Token Display

The `sendMessage` function uses the Fetch API with `ReadableStream` to process SSE tokens:

```js
const response = await fetch('/api/ai/chat/stream', { method: 'POST', body: ... })
const reader = response.body.getReader()
let assistantText = ''

while (true) {
  const { value, done } = await reader.read()
  if (done) break
  const chunk = new TextDecoder().decode(value)
  // Parse SSE "data: ..." lines
  assistantText += parseSSEChunk(chunk)
  updateStreamingMessage(assistantText)
}
```

## Voice Input

1. User clicks the mic button → `MediaRecorder` starts recording.
2. User clicks again → Recording stops; audio blob is collected.
3. Blob is sent via `FormData` to `/api/ai/speech/transcribe`.
4. Transcription is placed in the input box and auto-submitted.

> [!NOTE]
> The browser must have microphone permission. Safari requires `audio/mp4` encoding; Chrome defaults to `audio/webm`.

## Scroll Behavior

The chat area uses `overflow-y: auto` with `data-lenis-prevent` to prevent Lenis smooth-scroll from hijacking the internal scroll:

```jsx
<div
  className="flex-1 overflow-y-auto"
  data-lenis-prevent
  ref={scrollRef}
>
  {messages.map(msg => <MessageBubble key={msg.id} {...msg} />)}
</div>
```

Auto-scroll to bottom on new messages:

```js
useEffect(() => {
  scrollRef.current?.scrollTo({
    top: scrollRef.current.scrollHeight,
    behavior: 'smooth',
  })
}, [messages])
```

## Message Editing

Users can edit any of their previous messages:
1. Click the edit icon on a user message.
2. The input bar populates with the message content.
3. On submit, all messages **after** the edited message are removed from the local state and DB.
4. The edited message is sent as a new user turn.
