package org.zemo.omninet.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.storage.entity.FileMetadata;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {
    List<FileMetadata> findByUserId(String userId);
    List<FileMetadata> findByUserIdAndFolderPath(String userId, String folderPath);
    Optional<FileMetadata> findByUserIdAndS3Key(String userId, String s3Key);
    Optional<FileMetadata> findByIdAndUserId(String id, String userId);
    void deleteByIdAndUserId(String id, String userId);
    void deleteByUserIdAndS3Key(String userId, String s3Key);

    @Query("SELECT COALESCE(SUM(f.sizeBytes), 0) FROM FileMetadata f WHERE f.userId = :userId AND f.isFolder = false")
    Long sumSizeBytesByUserId(String userId);

    @Query("SELECT f FROM FileMetadata f WHERE f.userId = :userId AND f.s3Key LIKE CONCAT(:prefix, '%')")
    List<FileMetadata> findAllWithPrefix(String userId, String prefix);
}
