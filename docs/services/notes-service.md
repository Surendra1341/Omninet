# Notes Service

**Port:** `8083` (HTTP) · `9093` (gRPC)  
**Database:** `omninet_notes`

The notes service manages the full lifecycle of notes, categories, and todos. It communicates with the storage service via gRPC for file attachments.

## Features

- **Rich Notes CRUD** — Create, read, update, delete, search, and paginate notes.
- **Categories** — User-defined categories with colors. Default categories provisioned via Kafka on registration.
- **Todos** — Todo tasks with status workflows (`TODO`, `IN_PROGRESS`, `DONE`), reminders, and background schedulers.
- **File Attachments** — Notes can have file attachments uploaded via the storage service (gRPC).
- **30-Day Recycle Bin** — Soft-deleted notes are retained for 30 days before permanent deletion.
- **Favourites & Pins** — Notes can be pinned (top of list) or added to favourites.
- **Full-Text Search** — Search notes by title and content.
- **Duplicate** — Clone a note with one click.
- **Redis Caching** — Frequently accessed notes and category lists are cached.

## REST API

### Notes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/notes` | List notes (paginated) |
| `GET` | `/api/v1/notes/{id}` | Get note by ID |
| `POST` | `/api/v1/notes` | Create note (JSON or multipart) |
| `PUT` | `/api/v1/notes/{id}` | Update note |
| `DELETE` | `/api/v1/notes/{id}` | Move to recycle bin |
| `POST` | `/api/v1/notes/{id}/restore` | Restore from bin |
| `DELETE` | `/api/v1/notes/{id}/permanent` | Permanent delete |
| `GET` | `/api/v1/notes/search` | Full-text search |
| `GET` | `/api/v1/notes/bin` | List recycle bin |
| `POST` | `/api/v1/notes/{id}/duplicate` | Duplicate note |
| `PATCH` | `/api/v1/notes/{id}/pin` | Toggle pin |
| `PATCH` | `/api/v1/notes/{id}/favourite` | Toggle favourite |

### Categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/category/active-category` | List active categories |
| `POST` | `/api/v1/category/save` | Create or update category |
| `DELETE` | `/api/v1/category/{id}` | Delete category |

### Todos

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/todos` | List todos |
| `POST` | `/api/v1/todos` | Create todo |
| `PUT` | `/api/v1/todos/{id}` | Update todo |
| `DELETE` | `/api/v1/todos/{id}` | Delete todo |
| `PATCH` | `/api/v1/todos/{id}/status` | Toggle status |

## Note Request (Multipart)

Notes can be created with or without a file attachment via `multipart/form-data`:

```
POST /api/v1/notes
Content-Type: multipart/form-data

notes = {"title":"My Note","content":"...","category":{"id":1}}
file  = <binary>
```

The `notes` part is a JSON string parsed by the controller via `ObjectMapper`. This avoids Spring's `HttpMediaTypeNotSupportedException` which occurs when `@RequestBody` is used with multipart requests.

## Todo Status Schema

```json
{
  "id": 1,
  "name": "TODO"
}
```

`TodoStatus` uses `@JsonFormat(shape = JsonFormat.Shape.OBJECT)` and a `@JsonCreator` factory method that handles:
- Map input: `{ "id": 2, "name": "In Progress" }`
- Integer input: `2`
- String input: `"IN_PROGRESS"`
