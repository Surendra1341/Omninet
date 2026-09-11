package org.zemo.omninet.notes.grpc;

import com.google.protobuf.ByteString;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;
import org.zemo.omninet.proto.storage.*;

@Service
@Slf4j
public class StorageGrpcClient {

    @GrpcClient("storage-service")
    private StorageServiceGrpc.StorageServiceBlockingStub storageStub;

    public UploadFileResponse uploadAttachment(String userEmail, String filename, byte[] content, String contentType) {
        String filePath = "users/" + userEmail + "/notes/" + filename;
        log.info("Calling storage-service gRPC UploadFile for path: {}", filePath);

        UploadFileRequest request = UploadFileRequest.newBuilder()
                .setFilePath(filePath)
                .setContent(ByteString.copyFrom(content))
                .setContentType(contentType != null ? contentType : "application/octet-stream")
                .build();

        return storageStub.uploadFile(request);
    }

    public byte[] downloadAttachment(String filePath) {
        log.info("Calling storage-service gRPC DownloadFile for path: {}", filePath);
        DownloadFileRequest request = DownloadFileRequest.newBuilder()
                .setFilePath(filePath)
                .build();

        DownloadFileResponse response = storageStub.downloadFile(request);
        return response.getContent().toByteArray();
    }

    public boolean deleteAttachment(String userEmail, String filename) {
        log.info("Calling storage-service gRPC DeleteFile for user: {}, file: {}", userEmail, filename);
        DeleteFileRequest request = DeleteFileRequest.newBuilder()
                .setUserEmail(userEmail)
                .setFileName("notes/" + filename)
                .build();

        DeleteFileResponse response = storageStub.deleteFile(request);
        return response.getSuccess();
    }

    public String getDownloadUrl(String userEmail, String filename) {
        PresignedUrlRequest request = PresignedUrlRequest.newBuilder()
                .setUserEmail(userEmail)
                .setFileName("notes/" + filename)
                .setExpirySeconds(3600)
                .build();

        PresignedUrlResponse response = storageStub.generateDownloadUrl(request);
        return response.getUrl();
    }
}
