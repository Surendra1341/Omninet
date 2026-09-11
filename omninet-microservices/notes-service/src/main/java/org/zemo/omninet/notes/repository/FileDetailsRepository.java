package org.zemo.omninet.notes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.notes.entity.FileDetails;

@Repository
public interface FileDetailsRepository extends JpaRepository<FileDetails, Integer> {
}
