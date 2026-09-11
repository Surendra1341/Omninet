package org.zemo.omninet.notes.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.notes.entity.Notes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotesRepository extends JpaRepository<Notes, Integer> {
    Page<Notes> findByCreatedByAndIsDeletedFalse(String createdBy, Pageable pageable);
    Page<Notes> findByCreatedByAndIsDeletedTrue(String createdBy, Pageable pageable);
    List<Notes> findByCreatedByAndIsDeletedTrue(String createdBy);
    Page<Notes> findByCreatedByAndCategoryIdAndIsDeletedFalse(String createdBy, Integer categoryId, Pageable pageable);
    Optional<Notes> findByIdAndCreatedBy(Integer id, String createdBy);
    Optional<Notes> findByFileDetailsIdAndCreatedBy(Integer fileDetailsId, String createdBy);

    @Query("SELECT n FROM Notes n WHERE n.createdBy = :createdBy AND n.isDeleted = false AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(n.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Notes> searchNotes(String createdBy, String query, Pageable pageable);

    List<Notes> findByIsDeletedTrueAndDeletedOnBefore(LocalDateTime dateTime);

    @Modifying
    @Query("DELETE FROM Notes n WHERE n.createdBy = :createdBy AND n.isDeleted = true")
    void emptyRecycleBin(String createdBy);
}
