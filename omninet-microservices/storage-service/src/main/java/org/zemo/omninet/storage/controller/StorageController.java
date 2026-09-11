package org.zemo.omninet.storage.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;
import org.zemo.omninet.storage.dto.*;
import org.zemo.omninet.storage.entity.FileMetadata;
import org.zemo.omninet.storage.service.S3StorageService;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/storage", "/api/storage"})
@RequiredArgsConstructor
@Slf4j
public class StorageController {

    private final S3StorageService storageService;

    @PostMapping({"/files/upload-url", "/upload-url"})
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> getUploadUrl(
            @RequestBody(required = false) FileUploadRequest uploadRequest,
            @RequestParam(required = false) String fileName,
            @RequestParam(defaultValue = "3600") int expirySeconds,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        String targetFileName = uploadRequest != null && uploadRequest.getFileName() != null
                ? uploadRequest.getFileName()
                : fileName;

        PresignedUrlResponse response = storageService.generatePresignedUploadUrl(userId, userEmail, targetFileName, expirySeconds);
        return ResponseEntity.ok(ApiResponse.success(response, "Presigned upload URL generated"));
    }

    @RequestMapping(value = {"/files/download-url", "/download-url"}, method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> getDownloadUrl(
            @RequestBody(required = false) FileDownloadRequest downloadRequest,
            @RequestParam(required = false) String fileName,
            @RequestParam(defaultValue = "3600") int expirySeconds,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        String targetFileName = downloadRequest != null && downloadRequest.getFileName() != null
                ? downloadRequest.getFileName()
                : fileName;

        PresignedUrlResponse response = storageService.generatePresignedDownloadUrl(userId, userEmail, targetFileName, expirySeconds);
        return ResponseEntity.ok(ApiResponse.success(response, "Presigned download URL generated"));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileMetadata>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderPath", defaultValue = "root") String folderPath,
            HttpServletRequest request) throws IOException {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String s3Path = "root".equalsIgnoreCase(folderPath) ? originalFilename : folderPath + "/" + originalFilename;

        FileMetadata metadata = storageService.uploadFileDirect(
                userId,
                userEmail,
                s3Path,
                originalFilename,
                file.getContentType(),
                file.getBytes()
        );

        return ResponseEntity.ok(ApiResponse.success(metadata, "File uploaded successfully"));
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam String s3Key) {

        byte[] bytes = storageService.downloadFileDirect(s3Key);
        ByteArrayResource resource = new ByteArrayResource(bytes);

        String filename = s3Key;
        int lastSlash = filename.lastIndexOf('/');
        if (lastSlash >= 0) filename = filename.substring(lastSlash + 1);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PostMapping({"/folders", "/folder"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> createFolder(
            @Valid @RequestBody CreateFolderRequest folderRequest,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        boolean created = storageService.createFolder(userId, userEmail, folderRequest.getFolderName());
        Map<String, Object> result = Map.of(
                "created", created,
                "folderName", folderRequest.getFolderName(),
                "message", created ? "Folder created successfully" : "Folder already exists"
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Folder operation complete"));
    }

    @DeleteMapping({"/folders", "/folder"})
    public ResponseEntity<ApiResponse<Void>> deleteFolder(
            @Valid @RequestBody DeleteFolderRequest folderRequest,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        storageService.deleteFolder(userId, userEmail, folderRequest.getFolderName());
        return ResponseEntity.ok(ApiResponse.success(null, "Folder deleted successfully"));
    }

    @DeleteMapping({"/files", "/file"})
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @Valid @RequestBody DeleteFileRequest fileRequest,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        storageService.deleteFile(userId, userEmail, fileRequest.getFileName());
        return ResponseEntity.ok(ApiResponse.success(null, "File deleted successfully"));
    }

    @GetMapping("/files/exists")
    public ResponseEntity<ApiResponse<Boolean>> checkFileExists(
            @RequestParam String fileName,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        boolean exists = storageService.fileExists(userId, userEmail, fileName);
        return ResponseEntity.ok(ApiResponse.success(exists, "File existence checked"));
    }

    @GetMapping("/folders/exists")
    public ResponseEntity<ApiResponse<Boolean>> checkFolderExists(
            @RequestParam(required = false, defaultValue = "root") String folderName,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        boolean exists = storageService.folderExists(userId, userEmail, folderName);
        return ResponseEntity.ok(ApiResponse.success(exists, "Folder existence checked"));
    }

    @GetMapping({"/contents", "/list"})
    public ResponseEntity<ApiResponse<List<FileInfoResponse>>> listContents(
            @RequestParam(value = "folderName", required = false) String folderName,
            @RequestParam(value = "folderPath", required = false) String folderPath,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        String target = folderName != null ? folderName : (folderPath != null ? folderPath : "root");
        List<FileInfoResponse> items = storageService.listContents(userId, userEmail, target);
        return ResponseEntity.ok(ApiResponse.success(items, "Contents retrieved"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<StorageStatsResponse>> getStats(
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        StorageStatsResponse stats = storageService.getStorageStats(userId);
        return ResponseEntity.ok(ApiResponse.success(stats, "Storage statistics retrieved"));
    }
}
