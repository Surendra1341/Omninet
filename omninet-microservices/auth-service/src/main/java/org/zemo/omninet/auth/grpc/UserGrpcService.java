package org.zemo.omninet.auth.grpc;

import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.repository.UserRepository;
import org.zemo.omninet.proto.auth.*;

import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@GrpcService
@RequiredArgsConstructor
@Slf4j
public class UserGrpcService extends UserServiceGrpc.UserServiceImplBase {

    private final UserRepository userRepository;

    @Override
    public void getUserById(GetUserByIdRequest request, StreamObserver<UserResponse> responseObserver) {
        log.info("gRPC GetUserById received for userId: {}", request.getUserId());
        Optional<User> userOpt = userRepository.findById(request.getUserId());

        if (userOpt.isEmpty()) {
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription("User not found with id: " + request.getUserId())
                    .asRuntimeException());
            return;
        }

        responseObserver.onNext(toProtoResponse(userOpt.get()));
        responseObserver.onCompleted();
    }

    @Override
    public void getUserByEmail(GetUserByEmailRequest request, StreamObserver<UserResponse> responseObserver) {
        log.info("gRPC GetUserByEmail received for email: {}", request.getEmail());
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            responseObserver.onError(Status.NOT_FOUND
                    .withDescription("User not found with email: " + request.getEmail())
                    .asRuntimeException());
            return;
        }

        responseObserver.onNext(toProtoResponse(userOpt.get()));
        responseObserver.onCompleted();
    }

    @Override
    public void userExists(UserExistsRequest request, StreamObserver<UserExistsResponse> responseObserver) {
        boolean exists = userRepository.existsByEmail(request.getEmail());
        responseObserver.onNext(UserExistsResponse.newBuilder().setExists(exists).build());
        responseObserver.onCompleted();
    }

    @Override
    public void getUsersByIds(GetUsersByIdsRequest request, StreamObserver<GetUsersByIdsResponse> responseObserver) {
        List<User> users = userRepository.findByIdIn(request.getUserIdsList());
        GetUsersByIdsResponse.Builder responseBuilder = GetUsersByIdsResponse.newBuilder();

        for (User user : users) {
            responseBuilder.addUsers(toProtoResponse(user));
        }

        responseObserver.onNext(responseBuilder.build());
        responseObserver.onCompleted();
    }

    private UserResponse toProtoResponse(User user) {
        long createdAtMs = user.getCreatedAt() != null ?
                user.getCreatedAt().toInstant(ZoneOffset.UTC).toEpochMilli() : 0L;
        long lastLoginMs = user.getLastLoginAt() != null ?
                user.getLastLoginAt().toInstant(ZoneOffset.UTC).toEpochMilli() : 0L;

        return UserResponse.newBuilder()
                .setId(user.getId() != null ? user.getId() : "")
                .setEmail(user.getEmail() != null ? user.getEmail() : "")
                .setName(user.getName() != null ? user.getName() : "")
                .setAvatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : "")
                .setProvider(user.getProvider() != null ? user.getProvider() : "")
                .setEmailVerified(user.isEmailVerified())
                .setCreatedAtEpochMs(createdAtMs)
                .setLastLoginAtEpochMs(lastLoginMs)
                .build();
    }
}
