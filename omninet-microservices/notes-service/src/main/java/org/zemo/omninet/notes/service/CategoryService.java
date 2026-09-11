package org.zemo.omninet.notes.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.common.exception.BusinessException;
import org.zemo.omninet.common.exception.ResourceNotFoundException;
import org.zemo.omninet.notes.dto.CategoryDto;
import org.zemo.omninet.notes.entity.Category;
import org.zemo.omninet.notes.repository.CategoryRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public CategoryDto saveCategory(CategoryDto categoryDto, String userId) {
        Boolean exists = categoryRepository.existsByNameAndCreatedByAndIsDeletedFalse(categoryDto.getName(), userId);
        if (Boolean.TRUE.equals(exists)) {
            throw new BusinessException("Category with name '" + categoryDto.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(categoryDto.getName())
                .description(categoryDto.getDescription())
                .isActive(categoryDto.getIsActive() != null ? categoryDto.getIsActive() : true)
                .isDeleted(false)
                .colorHex(categoryDto.getColorHex() != null ? categoryDto.getColorHex() : "#6366f1")
                .build();
        category.setCreatedBy(userId);

        Category saved = categoryRepository.save(category);
        log.info("Saved category {} for user {}", saved.getName(), userId);
        return CategoryDto.fromEntity(saved);
    }

    @Transactional
    public CategoryDto updateCategory(CategoryDto categoryDto, String userId) {
        Category category = categoryRepository.findByIdAndCreatedBy(categoryDto.getId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryDto.getId()));

        if (categoryDto.getName() != null && !categoryDto.getName().equalsIgnoreCase(category.getName())) {
            Boolean exists = categoryRepository.existsByNameAndCreatedByAndIsDeletedFalse(categoryDto.getName(), userId);
            if (Boolean.TRUE.equals(exists)) {
                throw new BusinessException("Category with name '" + categoryDto.getName() + "' already exists");
            }
            category.setName(categoryDto.getName());
        }

        if (categoryDto.getDescription() != null) {
            category.setDescription(categoryDto.getDescription());
        }
        if (categoryDto.getIsActive() != null) {
            category.setIsActive(categoryDto.getIsActive());
        }
        if (categoryDto.getColorHex() != null) {
            category.setColorHex(categoryDto.getColorHex());
        }
        category.setUpdatedBy(userId);

        Category updated = categoryRepository.save(category);
        return CategoryDto.fromEntity(updated);
    }

    public List<CategoryDto> getAllCategories(String userId) {
        return categoryRepository.findByCreatedByAndIsDeletedFalse(userId)
                .stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<CategoryDto> getActiveCategories(String userId) {
        return categoryRepository.findByCreatedByAndIsActiveTrueAndIsDeletedFalse(userId)
                .stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public CategoryDto getCategoryById(Integer id, String userId) {
        Category category = categoryRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return CategoryDto.fromEntity(category);
    }

    public Category getCategoryEntity(Integer id, String userId) {
        if (id == null) {
            List<Category> userCategories = categoryRepository.findByCreatedByAndIsActiveTrueAndIsDeletedFalse(userId);
            if (!userCategories.isEmpty()) {
                return userCategories.get(0);
            }
            createDefaultCategoriesForUser(userId);
            userCategories = categoryRepository.findByCreatedByAndIsActiveTrueAndIsDeletedFalse(userId);
            if (!userCategories.isEmpty()) {
                return userCategories.get(0);
            }
            throw new BusinessException("No category available. Please create a category first.");
        }
        return categoryRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    @Transactional
    public void deleteCategory(Integer id, String userId) {
        Category category = categoryRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        category.setIsDeleted(true);
        category.setUpdatedBy(userId);
        categoryRepository.save(category);
        log.info("Soft-deleted category {} for user {}", id, userId);
    }

    @Transactional
    public void createDefaultCategoriesForUser(String userId) {
        List<String[]> defaults = List.of(
                new String[]{"Personal", "Personal life, family and hobbies", "#10b981"},
                new String[]{"Work", "Professional projects and meetings", "#3b82f6"},
                new String[]{"Ideas", "Brainstorms, inspiration and concepts", "#f59e0b"},
                new String[]{"Study", "Research, reading lists and learning", "#8b5cf6"}
        );

        for (String[] def : defaults) {
            if (!categoryRepository.existsByNameAndCreatedByAndIsDeletedFalse(def[0], userId)) {
                Category cat = Category.builder()
                        .name(def[0])
                        .description(def[1])
                        .colorHex(def[2])
                        .isActive(true)
                        .isDeleted(false)
                        .build();
                cat.setCreatedBy(userId);
                categoryRepository.save(cat);
            }
        }
    }
}
