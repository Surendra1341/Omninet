package org.zemo.omninet.ai.grpc;

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

    public String saveAudioFile(String userEmail, String filename, byte[] content, String contentType) {
        String filePath = "users/" + userEmail + "/audio/" + filename;
        try {
            UploadFileRequest request = UploadFileRequest.newBuilder()
                    .setFilePath(filePath)
                    .setContent(ByteString.copyFrom(content))
                    .setContentType(contentType != null ? contentType : "audio/wav")
                    .build();

            UploadFileResponse response = storageStub.uploadFile(request);
            return response.getFilePath();
        } catch (Exception e) {
            log.warn("Could not save audio file to storage-service via gRPC: {}", e.getMessage());
            return filePath;
        }
    }

    public byte[] getAudioFile(String filePath) {
        try {
            DownloadFileRequest request = DownloadFileRequest.newBuilder()
                    .setFilePath(filePath)
                    .build();
            return storageStub.downloadFile(request).getContent().toByteArray();
        } catch (Exception e) {
            log.warn("Could not download audio from storage-service via gRPC: {}", e.getMessage());
            return new byte[0];
        }
    }
}
