package org.zemo.omninet.storage.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.common.event.FileEvent;
import org.zemo.omninet.common.exception.BusinessException;
import org.zemo.omninet.common.exception.ResourceNotFoundException;
import org.zemo.omninet.storage.dto.*;
import org.zemo.omninet.storage.entity.FileMetadata;
import org.zemo.omninet.storage.event.FileEventProducer;
import org.zemo.omninet.storage.repository.FileMetadataRepository;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final FileMetadataRepository fileMetadataRepository;
    private final FileEventProducer fileEventProducer;

    @Value("${s3.bucket:omninet-files}")
    private String bucketName;

    @Value("${storage.default-quota-bytes:5368709120}") // 5 GB
    private long defaultQuotaBytes;

    @PostConstruct
    public void init() {
        try {
            ensureBucketExists();
        } catch (Exception e) {
            log.warn("Could not verify S3 bucket existence at startup (S3 may not be running yet): {}", e.getMessage());
        }
    }

    public void ensureBucketExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 Bucket '{}' verified", bucketName);
        } catch (NoSuchBucketException e) {
            log.info("Creating bucket: {}", bucketName);
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            log.info("Created S3 bucket: {}", bucketName);
        } catch (Exception e) {
            log.debug("HeadBucket check: {}", e.getMessage());
        }
    }

    public void provisionUserFolders(String userId, String userEmail) {
        String base = "users/" + userEmail + "/";
        createFolderIfNotExists(userId, userEmail, base);
        createFolderIfNotExists(userId, userEmail, base + "notes/");
        createFolderIfNotExists(userId, userEmail, base + "audio/");
        createFolderIfNotExists(userId, userEmail, base + "uploads/");
        log.info("Provisioned user storage folders for: {}", userEmail);
    }

    @Transactional
    public boolean createFolder(String userId, String userEmail, String folderPath) {
        String fullKey = normalizeFolderKey(userEmail, folderPath);
        return createFolderIfNotExists(userId, userEmail, fullKey);
    }

    private boolean createFolderIfNotExists(String userId, String userEmail, String fullKey) {
        if (!fullKey.endsWith("/")) {
            fullKey += "/";
        }

        try {
            if (s3ObjectExists(fullKey)) {
                return false;
            }

            s3Client.putObject(
                    PutObjectRequest.builder().bucket(bucketName).key(fullKey).build(),
                    RequestBody.fromBytes(new byte[0])
            );

            // Record in database
            String folderName = fullKey.substring(0, fullKey.length() - 1);
            int lastSlash = folderName.lastIndexOf('/');
            if (lastSlash >= 0) {
                folderName = folderName.substring(lastSlash + 1);
            }

            FileMetadata meta = FileMetadata.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .filename(folderName)
                    .s3Key(fullKey)
                    .s3Bucket(bucketName)
                    .sizeBytes(0L)
                    .isFolder(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            fileMetadataRepository.save(meta);

            fileEventProducer.publishFileEvent(userId, fullKey, 0L, FileEvent.Action.FOLDER_CREATED);
            return true;
        } catch (Exception e) {
            log.error("Failed to create folder {}: {}", fullKey, e.getMessage(), e);
            throw new BusinessException("Failed to create folder: " + e.getMessage());
        }
    }

    @Transactional
    public boolean deleteFolder(String userId, String userEmail, String folderPath) {
        String fullKey = normalizeFolderKey(userEmail, folderPath);
        if (!fullKey.endsWith("/")) {
            fullKey += "/";
        }

        try {
            // List all objects with this prefix
            ListObjectsV2Response list = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder().bucket(bucketName).prefix(fullKey).build()
            );

            for (S3Object s3Object : list.contents()) {
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(s3Object.key()).build());
                fileMetadataRepository.deleteByUserIdAndS3Key(userId, s3Object.key());
            }

            fileEventProducer.publishFileEvent(userId, fullKey, 0L, FileEvent.Action.FOLDER_DELETED);
            return true;
        } catch (Exception e) {
            log.error("Failed to delete folder {}: {}", fullKey, e.getMessage(), e);
            throw new BusinessException("Failed to delete folder: " + e.getMessage());
        }
    }

    public PresignedUrlResponse generatePresignedUploadUrl(String userId, String userEmail, String fileName, int expirySeconds) {
        String s3Key = buildS3Key(userEmail, fileName);
        int expiry = expirySeconds > 0 ? expirySeconds : 3600;

        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiry))
                .putObjectRequest(objectRequest)
                .build();

        var presignedPut = s3Presigner.presignPutObject(presignRequest);
        long expiresAtEpochMs = System.currentTimeMillis() + (expiry * 1000L);

        return PresignedUrlResponse.builder()
                .url(presignedPut.url().toString())
                .fileName(fileName)
                .expiresAtEpochMs(expiresAtEpochMs)
                .build();
    }

    public PresignedUrlResponse generatePresignedDownloadUrl(String userId, String userEmail, String fileName, int expirySeconds) {
        String s3Key = resolveS3Key(userEmail, fileName);
        int expiry = expirySeconds > 0 ? expirySeconds : 3600;

        String contentType = determineContentType(s3Key);
        String baseFileName = s3Key.contains("/") ? s3Key.substring(s3Key.lastIndexOf('/') + 1) : s3Key;

        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .responseContentType(contentType)
                .responseContentDisposition("inline; filename=\"" + baseFileName + "\"")
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiry))
                .getObjectRequest(objectRequest)
                .build();

        var presignedGet = s3Presigner.presignGetObject(presignRequest);
        long expiresAtEpochMs = System.currentTimeMillis() + (expiry * 1000L);

        return PresignedUrlResponse.builder()
                .url(presignedGet.url().toString())
                .fileName(fileName)
                .expiresAtEpochMs(expiresAtEpochMs)
                .build();
    }

    @Transactional
    public FileMetadata uploadFileDirect(String userId, String userEmail, String filePath,
                                         String originalFilename, String contentType, byte[] content) {

        // Check storage quota
        Long currentUsed = fileMetadataRepository.sumSizeBytesByUserId(userId);
        if (currentUsed != null && (currentUsed + content.length) > defaultQuotaBytes) {
            throw new BusinessException("Storage quota exceeded. Please free up space or upgrade storage.");
        }

        String s3Key = filePath.startsWith("users/") ? filePath : buildS3Key(userEmail, filePath);

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(s3Key)
                            .contentType(contentType != null ? contentType : "application/octet-stream")
                            .contentLength((long) content.length)
                            .build(),
                    RequestBody.fromBytes(content)
            );

            // Determine folder
            String folderPath = "root";
            int lastSlash = s3Key.lastIndexOf('/');
            if (lastSlash > 0) {
                folderPath = s3Key.substring(0, lastSlash);
            }

            String filename = originalFilename != null ? originalFilename : s3Key.substring(lastSlash + 1);

            FileMetadata meta = FileMetadata.builder()
                    .userId(userId)
                    .userEmail(userEmail)
                    .filename(filename)
                    .originalFilename(originalFilename)
                    .contentType(contentType)
                    .sizeBytes((long) content.length)
                    .s3Key(s3Key)
                    .s3Bucket(bucketName)
                    .folderPath(folderPath)
                    .isFolder(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            FileMetadata saved = fileMetadataRepository.save(meta);
            fileEventProducer.publishFileEvent(userId, s3Key, content.length, FileEvent.Action.UPLOADED);
            return saved;
        } catch (Exception e) {
            log.error("Failed to upload file to S3: {}", e.getMessage(), e);
            throw new BusinessException("Upload failed: " + e.getMessage());
        }
    }

    public byte[] downloadFileDirect(String s3Key) {
        try {
            ResponseInputStream<GetObjectResponse> stream = s3Client.getObject(
                    GetObjectRequest.builder().bucket(bucketName).key(s3Key).build()
            );
            return stream.readAllBytes();
        } catch (NoSuchKeyException e) {
            throw new ResourceNotFoundException("File not found in storage: " + s3Key);
        } catch (IOException e) {
            throw new BusinessException("Failed to read file content: " + e.getMessage());
        }
    }

    @Transactional
    public boolean deleteFile(String userId, String userEmail, String fileName) {
        String s3Key = resolveS3Key(userEmail, fileName);

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(s3Key).build());
            fileMetadataRepository.deleteByUserIdAndS3Key(userId, s3Key);
            fileEventProducer.publishFileEvent(userId, s3Key, 0L, FileEvent.Action.DELETED);
            return true;
        } catch (Exception e) {
            log.error("Failed to delete file {}: {}", s3Key, e.getMessage());
            return false;
        }
    }

    public boolean s3ObjectExists(String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder().bucket(bucketName).key(key).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean fileExists(String userId, String userEmail, String fileName) {
        String s3Key = resolveS3Key(userEmail, fileName);
        return s3ObjectExists(s3Key);
    }

    public boolean folderExists(String userId, String userEmail, String folderName) {
        String prefix = normalizeFolderKey(userEmail, folderName);
        if (!prefix.endsWith("/")) {
            prefix += "/";
        }
        return s3ObjectExists(prefix);
    }

    public List<FileInfoResponse> listContents(String userId, String userEmail, String folderPath) {
        String prefix = folderPath == null || folderPath.isBlank() || "root".equalsIgnoreCase(folderPath)
                ? "users/" + userEmail + "/"
                : normalizeFolderKey(userEmail, folderPath);

        if (!prefix.endsWith("/")) {
            prefix += "/";
        }

        try {
            ListObjectsV2Response response = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(bucketName)
                            .prefix(prefix)
                            .delimiter("/")
                            .build()
            );

            List<FileInfoResponse> items = new ArrayList<>();

            // Add common prefixes (folders)
            for (CommonPrefix cp : response.commonPrefixes()) {
                String fullPath = cp.prefix();
                String folderName = fullPath.substring(0, fullPath.length() - 1);
                int lastSlash = folderName.lastIndexOf('/');
                if (lastSlash >= 0) folderName = folderName.substring(lastSlash + 1);

                items.add(FileInfoResponse.builder()
                        .name(folderName)
                        .fullPath(fullPath)
                        .sizeBytes(0L)
                        .isFolder(true)
                        .lastModifiedEpochMs(0L)
                        .build());
            }

            // Add objects (files)
            for (S3Object obj : response.contents()) {
                if (obj.key().equals(prefix)) {
                    continue; // Skip the directory placeholder itself
                }

                String name = obj.key();
                int lastSlash = name.lastIndexOf('/');
                if (lastSlash >= 0) name = name.substring(lastSlash + 1);

                long lastModified = obj.lastModified() != null ? obj.lastModified().toEpochMilli() : 0L;

                items.add(FileInfoResponse.builder()
                        .name(name)
                        .fullPath(obj.key())
                        .sizeBytes(obj.size())
                        .lastModifiedEpochMs(lastModified)
                        .isFolder(false)
                        .build());
            }

            return items;
        } catch (Exception e) {
            log.error("Failed to list S3 contents for prefix {}: {}", prefix, e.getMessage());
            return Collections.emptyList();
        }
    }

    public StorageStatsResponse getStorageStats(String userId) {
        Long used = fileMetadataRepository.sumSizeBytesByUserId(userId);
        long usedBytes = used != null ? used : 0L;
        List<FileMetadata> files = fileMetadataRepository.findByUserId(userId);
        int fileCount = (int) files.stream().filter(f -> !f.isFolder()).count();

        double percentage = defaultQuotaBytes > 0 ? ((double) usedBytes / defaultQuotaBytes) * 100.0 : 0.0;

        return StorageStatsResponse.builder()
                .usedBytes(usedBytes)
                .quotaBytes(defaultQuotaBytes)
                .usagePercentage(Math.round(percentage * 10.0) / 10.0)
                .fileCount(fileCount)
                .build();
    }

    public String resolveS3Key(String userEmail, String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return buildS3Key(userEmail, "");
        }

        // 1. Direct path check
        String directKey = buildS3Key(userEmail, fileName);
        if (s3ObjectExists(directKey)) {
            return directKey;
        }

        // 2. If caller passed a path that already exists in S3
        if (s3ObjectExists(fileName)) {
            return fileName;
        }

        // 3. Fallback search: search within the user's bucket prefix for matching filename
        try {
            String userPrefix = "users/" + userEmail + "/";
            String targetFileName = fileName.contains("/") ? fileName.substring(fileName.lastIndexOf('/') + 1) : fileName;

            ListObjectsV2Response response = s3Client.listObjectsV2(
                    ListObjectsV2Request.builder()
                            .bucket(bucketName)
                            .prefix(userPrefix)
                            .build()
            );

            for (S3Object obj : response.contents()) {
                if (obj.key().endsWith("/" + targetFileName) || obj.key().equals(userPrefix + targetFileName)) {
                    log.info("Resolved S3 key '{}' for requested filename '{}'", obj.key(), fileName);
                    return obj.key();
                }
            }
        } catch (Exception e) {
            log.warn("Error resolving S3 key for user {} file {}: {}", userEmail, fileName, e.getMessage());
        }

        // Default fallback to direct key
        return directKey;
    }

    private String determineContentType(String s3Key) {
        String lower = s3Key.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".txt") || lower.endsWith(".log")) return "text/plain";
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".xml")) return "application/xml";
        if (lower.endsWith(".csv")) return "text/csv";
        if (lower.endsWith(".java") || lower.endsWith(".js") || lower.endsWith(".jsx")
                || lower.endsWith(".ts") || lower.endsWith(".tsx") || lower.endsWith(".py")
                || lower.endsWith(".c") || lower.endsWith(".cpp") || lower.endsWith(".md")
                || lower.endsWith(".sh") || lower.endsWith(".sql")) return "text/plain";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".mp4")) return "video/mp4";
        return "application/octet-stream";
    }

    private String buildS3Key(String userEmail, String fileName) {
        if (fileName.startsWith("users/")) {
            return fileName;
        }
        return "users/" + userEmail + "/" + fileName;
    }

    private String normalizeFolderKey(String userEmail, String folderPath) {
        if (folderPath.startsWith("users/")) {
            return folderPath;
        }
        return "users/" + userEmail + "/" + folderPath;
    }
}
