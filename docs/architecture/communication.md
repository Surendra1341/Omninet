# Inter-Service Communication

OmniNet uses two communication mechanisms between services:

1. **gRPC** — synchronous, strongly-typed RPC for latency-sensitive operations.
2. **Kafka** — asynchronous event streaming for fire-and-forget fan-out.

---

## gRPC Services

All Protobuf definitions live in `omninet-proto/src/main/proto/`. Generated stubs are distributed as a Maven artifact.

### UserServiceGrpc (`auth-service` :9091)

```protobuf
service UserService {
  rpc GetUserById(UserIdRequest) returns (UserResponse);
  rpc GetUserByEmail(UserEmailRequest) returns (UserResponse);
  rpc ValidateToken(TokenRequest) returns (ValidationResponse);
  rpc UpdateUserQuota(QuotaUpdateRequest) returns (UserResponse);
}
```

**Consumers:** api-gateway (token validation), storage-service (quota sync)

---

### StorageServiceGrpc (`storage-service` :9095)

```protobuf
service StorageService {
  rpc UploadFile(stream FileChunk) returns (UploadResponse);
  rpc DownloadFile(FileRequest) returns (stream FileChunk);
  rpc DeleteFile(FileRequest) returns (DeleteResponse);
  rpc CheckFileExists(FileRequest) returns (ExistsResponse);
  rpc CreateUserFolders(UserFolderRequest) returns (FolderResponse);
}
```

**Consumers:** notes-service (file attachments), ai-service (audio files)

---

### NotesServiceGrpc (`notes-service` :9093)

```protobuf
service NotesService {
  rpc GetNoteById(NoteIdRequest) returns (NoteResponse);
  rpc ValidateNoteOwnership(NoteOwnershipRequest) returns (ValidationResponse);
  rpc GetNotesStats(UserIdRequest) returns (NotesStatsResponse);
}
```

---

### SpeechServiceGrpc (`ai-service` :9094)

```protobuf
service SpeechService {
  rpc SpeechToText(stream AudioChunk) returns (TranscriptionResponse);
  rpc TextToSpeech(TtsRequest) returns (stream AudioChunk);
}
```

**Consumers:** ai-service frontend voice chat pipeline

---

## Request Header Propagation

The API Gateway enriches every forwarded request with:

```
X-User-Id: <userId>
X-User-Email: <userEmail>
```

Downstream services extract these via `GatewayHeaders` (from `omninet-common`):

```java
String userId = GatewayHeaders.getUserId(request);
String email  = GatewayHeaders.getUserEmail(request);
```

This eliminates the need for services to re-validate JWTs.
