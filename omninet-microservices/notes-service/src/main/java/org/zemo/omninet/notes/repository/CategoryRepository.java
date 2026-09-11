package org.zemo.omninet.notes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.notes.entity.Category;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    List<Category> findByCreatedByAndIsDeletedFalse(String createdBy);
    List<Category> findByCreatedByAndIsActiveTrueAndIsDeletedFalse(String createdBy);
    Optional<Category> findByIdAndCreatedBy(Integer id, String createdBy);
    Boolean existsByNameAndCreatedByAndIsDeletedFalse(String name, String createdBy);
}
