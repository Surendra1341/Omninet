# Troubleshooting

A curated log of every issue encountered during the OmniNet microservices migration, along with root causes and applied fixes.

---

## 1. Storage gRPC Port Collision (`9092` → `9095`)

**Symptom:** `storage-service` gRPC server failed to bind — port already in use.  
**Root cause:** gRPC was initially mapped to `9092`, clashing with Apache Kafka broker.  
**Fix:** Remapped to `9095` across code, configuration, `.env`, and Docker Compose.

---

## 2. Spring Security Basic Auth on API Gateway

**Symptom:** `401 Unauthorized (WWW-Authenticate: Basic realm)` on all requests.  
**Root cause:** `omninet-common` pulled `spring-boot-starter-security` transitively into `api-gateway`, causing Spring Security's default basic auth filter to intercept all requests before the custom JWT filter.  
**Fix:** Excluded `spring-boot-starter-security` from `api-gateway/pom.xml`.

---

## 3. Mail Health Indicator Blocking Actuator

**Symptom:** `/actuator/health` returned `DOWN` in Docker.  
**Root cause:** Missing `SPRING_MAIL_*` environment variables caused the mail health indicator to report `DOWN`.  
**Fix:** Added `management.health.mail.enabled: false` to `auth-service` configuration.

---

## 4. `CleanupService` Missing `@Transactional`

**Symptom:** `Executing an update/delete query` exception during scheduled cleanup.  
**Fix:** Added `@Modifying` and `@Transactional` to repository delete queries and `@Transactional` to `CleanupService`.

---

## 5. `NoResourceFoundException` → 500

**Symptom:** 404 routes returned 500 instead of 404.  
**Fix:** Added `@ExceptionHandler(NoResourceFoundException.class)` to `GlobalExceptionHandler`.

---

## 6. Duplicate CORS Headers

**Symptom:** Browser rejected responses with duplicate `Access-Control-Allow-Origin` headers.  
**Root cause:** Both the gateway and downstream services set CORS headers.  
**Fix:** Disabled CORS in all downstream services. Added `DedupeResponseHeader=Access-Control-Allow-Origin Access-Control-Allow-Credentials, RETAIN_FIRST` to API Gateway default filters.

---

## 7. Google OAuth2 "Error 400: invalid_request"

**Symptom:** Google OAuth2 login failed with `redirect_uri_mismatch`.  
**Root cause:** Spring Security computed the redirect URI using the internal Docker container hostname (`auth-service`), which Google rejects as insecure.  
**Fix:**
- Set `server.forward-headers-strategy: framework` in `auth-service`.
- Hardcoded `redirect-uri: http://localhost:8080/login/oauth2/code/{registrationId}`.

---

## 8. Spring Cloud Gateway 4.3.0 Property Prefix Change

**Symptom:** JWT filter never ran; all requests forwarded without authentication.  
**Root cause:** In Spring Cloud Gateway 4.3.0+, `routes` and `default-filters` must be under `spring.cloud.gateway.server.webflux`, not `spring.cloud.gateway`. The old prefix is silently ignored.  
**Fix:** Re-indented `default-filters` and `routes` under `spring.cloud.gateway.server.webflux`.

---

## 9. WebSocket `404 Not Found` (`/ws/info`)

**Symptom:** Frontend SockJS STOMP connection failed with 404.  
**Root cause:** No WebSocket route was configured in the gateway.  
**Fix:** Added `/ws/**` gateway route to `ai-service`, added `spring-boot-starter-websocket`, and created `WebSocketConfig.java` with SockJS STOMP support.

---

## 10. Kafka Snappy `UnsatisfiedLinkError` on Alpine Linux

**Symptom:** Kafka message publishing threw `UnsatisfiedLinkError: Error loading shared library ld-linux-x86-64.so.2`.  
**Root cause:** Snappy compression uses native JNI libraries incompatible with Alpine Linux's musl libc.  
**Fix:** Changed `COMPRESSION_TYPE_CONFIG` to `"none"` (configurable via `KAFKA_COMPRESSION_TYPE` env var).

---

## 11. Gemini API IPv6 / DNS Timeout

**Symptom:** AI service hung on Gemini API calls; DNS resolution timed out.  
**Root cause:** JVM preferred IPv6, which timed out before IPv4 fallback.  
**Fix:** Set `JAVA_OPTS=-Djava.net.preferIPv4Stack=true`.

---

## 12. MinIO Presigned URL `ERR_NAME_NOT_RESOLVED`

**Symptom:** Browser couldn't upload to presigned URL — `minio` hostname not resolvable.  
**Root cause:** Presigned URLs were signed with `http://minio:9000`, an internal Docker hostname.  
**Fix:** Configured a dedicated `s3Presigner` using `S3_PUBLIC_ENDPOINT=http://localhost:9000`.

---

## 13. Todo `500` — `Cannot deserialize value of type TodoStatus from Object`

**Symptom:** Creating todos failed with Jackson deserialization error.  
**Root cause:** Frontend sent `status: { id: 2, name: "In Progress" }` but `TodoStatus` was a plain enum.  
**Fix:** Annotated `TodoStatus` with `@JsonFormat(shape = OBJECT)` and added `@JsonCreator` handling map/int/string input.

---

## 14. Category Save `400 Bad Request`

**Symptom:** Editing a category returned 400 (duplicate name error).  
**Root cause:** `CategoryController` always created a new category, even when `id` was present.  
**Fix:** Added id check in `CategoryController` to delegate to `updateCategory` when `id != null`.

---

## 15. AI Chat `state.chatSessions.find is not a function`

**Symptom:** Chat sessions page crashed with TypeError.  
**Root cause:** `api.js` returned the full `ApiResponse` wrapper (`{ success, data: [...] }`) instead of unwrapping the inner array.  
**Fix:** Updated `aiChatAPI` methods to unwrap `response.data?.data`.

---

## 16. Notes Multipart `HttpMediaTypeNotSupportedException`

**Symptom:** Creating notes with file attachments returned 500.  
**Root cause:** `@RequestBody` on a multipart endpoint caused Spring to throw `HttpMediaTypeNotSupportedException`.  
**Fix:** Split endpoint into separate `@PostMapping(consumes = MULTIPART_FORM_DATA_VALUE)` and JSON handlers.

---

## 17. `note.category` Undefined in Frontend

**Symptom:** `TypeError: Cannot read properties of undefined (reading 'name')` in `NotesGrid`.  
**Root cause:** `NotesDto` returned flat `categoryId`/`categoryName` fields but frontend accessed `note.category.name`.  
**Fix:** Added nested `category: CategoryDto` field to `NotesDto.java`.
