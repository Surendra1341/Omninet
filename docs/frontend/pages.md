# Pages & Features

## Landing Page (`/`)

- Full-screen hero with animated product showcase.
- Feature highlights and call-to-action buttons.
- Smooth section transitions powered by GSAP ScrollTrigger.

---

## Auth Pages

### Login (`/login`)
- Email/password form with validation.
- "Continue with Google" and "Continue with GitHub" OAuth2 buttons.
- Forgot password flow.

### Register (`/register`)
- Email/password/name form.
- Backend triggers OTP email on submit.

### OTP Verification (`/verify-otp`)
- 6-digit OTP input with countdown timer.
- Resend OTP support.

### OAuth Callback (`/auth/callback`)
- Extracts `access_token` and `refresh_token` from URL params after OAuth redirect.
- Stores tokens and redirects to dashboard.

---

## Dashboard (`/dashboard`)

- Summary cards: note count, storage used, active sessions.
- Recent notes list.
- Quick actions: New Note, Upload File, New Chat.

---

## Notes (`/notes`)

- **Grid / List view** toggle.
- Search bar with live filtering.
- Category filter sidebar.
- Note cards with title, category badge, date, and action buttons.
- **NoteDetailModal** — Full note view with content, category, attachments.
- **Create/Edit Form** — Rich textarea with category picker, file upload, pin/favourite toggles.
- **Recycle Bin** — Soft-deleted notes with restore and permanent delete.

---

## Files (`/files`)

- Folder-tree navigation with breadcrumbs.
- File list with icon, name, size, and last modified.
- **Upload** — Direct browser-to-MinIO upload via presigned PUT URL.
- **Preview** — Opens files inline in a new tab (PDF, images).
- **Download** — Presigned GET URL download.
- **Delete** — Permanent file removal.

---

## AI Chat (`/ai-chat`)

- **Session Sidebar** — List of chat sessions; click to switch. New session button.
- **Chat Area** — Message bubbles with user/AI distinction.
  - Markdown with syntax-highlighted code blocks.
  - Streaming token-by-token display.
  - Copy message button.
  - Edit and resend messages.
- **Input Bar** — Text input with voice recording button (mic).
- **Typing Indicator** — Animated dots while AI is responding.

---

## Categories (`/categories`)

- Create, edit, and delete note categories.
- Color picker for category badge color.
- Default categories auto-provisioned on registration.

---

## Profile (`/profile`)

- View and update user profile (name, avatar).
- Token management (view active refresh tokens, revoke).
- Storage usage bar.
