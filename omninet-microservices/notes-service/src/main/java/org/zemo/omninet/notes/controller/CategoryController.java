package org.zemo.omninet.notes.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;
import org.zemo.omninet.notes.dto.CategoryDto;
import org.zemo.omninet.notes.service.CategoryService;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/category", "/api/v1/categories", "/api/category", "/api/categories"})
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping({"", "/save"})
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(
            @Valid @RequestBody CategoryDto categoryDto,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        if (categoryDto.getId() != null) {
            CategoryDto updated = categoryService.updateCategory(categoryDto, userId);
            return ResponseEntity.ok(ApiResponse.success(updated, "Category updated successfully"));
        }
        CategoryDto saved = categoryService.saveCategory(categoryDto, userId);
        return ResponseEntity.ok(ApiResponse.success(saved, "Category created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody CategoryDto categoryDto,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        categoryDto.setId(id);
        CategoryDto updated = categoryService.updateCategory(categoryDto, userId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Category updated successfully"));
    }

    @GetMapping({"", "/category", "/all"})
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getAllCategories(HttpServletRequest request) {
        String userId = GatewayHeaders.getUserId(request);
        List<CategoryDto> categories = categoryService.getAllCategories(userId);
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved"));
    }

    @GetMapping({"/active", "/active-category"})
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getActiveCategories(HttpServletRequest request) {
        String userId = GatewayHeaders.getUserId(request);
        List<CategoryDto> categories = categoryService.getActiveCategories(userId);
        return ResponseEntity.ok(ApiResponse.success(categories, "Active categories retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        CategoryDto category = categoryService.getCategoryById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(category, "Category retrieved"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        categoryService.deleteCategory(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
