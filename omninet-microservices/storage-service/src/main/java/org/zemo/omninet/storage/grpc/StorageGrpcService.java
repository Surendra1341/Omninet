package org.zemo.omninet.storage.grpc;

import com.google.protobuf.ByteString;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.zemo.omninet.proto.storage.*;
import org.zemo.omninet.storage.dto.FileInfoResponse;
import org.zemo.omninet.storage.dto.PresignedUrlResponse;
import org.zemo.omninet.storage.entity.FileMetadata;
import org.zemo.omninet.storage.service.S3StorageService;

import java.util.List;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class StorageGrpcService extends StorageServiceGrpc.StorageServiceImplBase {

    private final S3StorageService storageService;

    @Override
    public void generateUploadUrl(PresignedUrlRequest request, StreamObserver<org.zemo.omninet.proto.storage.PresignedUrlResponse> responseObserver) {
        try {
            PresignedUrlResponse res = storageService.generatePresignedUploadUrl(
                    "grpc-caller",
                    request.getUserEmail(),
                    request.getFileName(),
                    request.getExpirySeconds()
            );

            responseObserver.onNext(org.zemo.omninet.proto.storage.PresignedUrlResponse.newBuilder()
                    .setUrl(res.getUrl())
                    .setFileName(res.getFileName())
                    .setExpiresAtEpochMs(res.getExpiresAtEpochMs())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC generateUploadUrl error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void generateDownloadUrl(PresignedUrlRequest request, StreamObserver<org.zemo.omninet.proto.storage.PresignedUrlResponse> responseObserver) {
        try {
            PresignedUrlResponse res = storageService.generatePresignedDownloadUrl(
                    "grpc-caller",
                    request.getUserEmail(),
                    request.getFileName(),
                    request.getExpirySeconds()
            );

            responseObserver.onNext(org.zemo.omninet.proto.storage.PresignedUrlResponse.newBuilder()
                    .setUrl(res.getUrl())
                    .setFileName(res.getFileName())
                    .setExpiresAtEpochMs(res.getExpiresAtEpochMs())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC generateDownloadUrl error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void uploadFile(UploadFileRequest request, StreamObserver<UploadFileResponse> responseObserver) {
        try {
            byte[] bytes = request.getContent().toByteArray();
            FileMetadata meta = storageService.uploadFileDirect(
                    "grpc-system",
                    "system",
                    request.getFilePath(),
                    null,
                    request.getContentType(),
                    bytes
            );

            responseObserver.onNext(UploadFileResponse.newBuilder()
                    .setSuccess(true)
                    .setFilePath(meta.getS3Key())
                    .setSizeBytes(meta.getSizeBytes())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC uploadFile error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void downloadFile(DownloadFileRequest request, StreamObserver<DownloadFileResponse> responseObserver) {
        try {
            byte[] bytes = storageService.downloadFileDirect(request.getFilePath());

            responseObserver.onNext(DownloadFileResponse.newBuilder()
                    .setContent(ByteString.copyFrom(bytes))
                    .setContentType("application/octet-stream")
                    .setSizeBytes(bytes.length)
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC downloadFile error: {}", e.getMessage(), e);
            responseObserver.onError(Status.NOT_FOUND.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void deleteFile(DeleteFileRequest request, StreamObserver<DeleteFileResponse> responseObserver) {
        try {
            boolean success = storageService.deleteFile("grpc-caller", request.getUserEmail(), request.getFileName());
            responseObserver.onNext(DeleteFileResponse.newBuilder().setSuccess(success).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC deleteFile error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void createFolder(CreateFolderRequest request, StreamObserver<CreateFolderResponse> responseObserver) {
        try {
            boolean created = storageService.createFolder("grpc-caller", request.getUserEmail(), request.getFolderName());
            responseObserver.onNext(CreateFolderResponse.newBuilder()
                    .setCreated(created)
                    .setFolderPath(request.getFolderName())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC createFolder error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void deleteFolder(DeleteFolderRequest request, StreamObserver<DeleteFolderResponse> responseObserver) {
        try {
            boolean success = storageService.deleteFolder("grpc-caller", request.getUserEmail(), request.getFolderName());
            responseObserver.onNext(DeleteFolderResponse.newBuilder().setSuccess(success).build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC deleteFolder error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }

    @Override
    public void fileExists(FileExistsRequest request, StreamObserver<FileExistsResponse> responseObserver) {
        boolean exists = storageService.s3ObjectExists(request.getFilePath());
        responseObserver.onNext(FileExistsResponse.newBuilder().setExists(exists).build());
        responseObserver.onCompleted();
    }

    @Override
    public void listContents(ListContentsRequest request, StreamObserver<ListContentsResponse> responseObserver) {
        try {
            List<FileInfoResponse> items = storageService.listContents("grpc-caller", request.getUserEmail(), request.getFolderName());
            ListContentsResponse.Builder builder = ListContentsResponse.newBuilder();

            for (FileInfoResponse item : items) {
                builder.addItems(FileInfo.newBuilder()
                        .setName(item.getName())
                        .setFullPath(item.getFullPath())
                        .setSizeBytes(item.getSizeBytes())
                        .setLastModifiedEpochMs(item.getLastModifiedEpochMs())
                        .setIsFolder(item.isFolder())
                        .build());
            }

            responseObserver.onNext(builder.build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("gRPC listContents error: {}", e.getMessage(), e);
            responseObserver.onError(Status.INTERNAL.withDescription(e.getMessage()).asRuntimeException());
        }
    }
}
