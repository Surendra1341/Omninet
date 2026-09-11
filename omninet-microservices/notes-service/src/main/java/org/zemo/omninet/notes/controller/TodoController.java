package org.zemo.omninet.notes.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;
import org.zemo.omninet.notes.dto.TodoDto;
import org.zemo.omninet.notes.enums.TodoStatus;
import org.zemo.omninet.notes.service.TodoService;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/todo", "/api/v1/todos", "/api/todo", "/api/todos"})
@RequiredArgsConstructor
@Slf4j
public class TodoController {

    private final TodoService todoService;

    @PostMapping({"", "/"})
    public ResponseEntity<ApiResponse<TodoDto>> createTodo(
            @Valid @RequestBody TodoDto todoDto,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        if (todoDto.getId() != null) {
            TodoDto updated = todoService.updateTodo(todoDto.getId(), todoDto, userId);
            return ResponseEntity.ok(ApiResponse.success(updated, "Todo task updated"));
        }
        TodoDto saved = todoService.createTodo(todoDto, userId);
        return ResponseEntity.ok(ApiResponse.success(saved, "Todo task created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoDto>> updateTodo(
            @PathVariable Integer id,
            @Valid @RequestBody TodoDto todoDto,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        TodoDto updated = todoService.updateTodo(id, todoDto, userId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Todo task updated"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TodoDto>> updateStatus(
            @PathVariable Integer id,
            @RequestParam TodoStatus status,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        TodoDto updated = todoService.updateStatus(id, status, userId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Todo status updated"));
    }

    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<List<TodoDto>>> getAllTodos(
            @RequestParam(required = false) TodoStatus status,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        List<TodoDto> todos = status != null ?
                todoService.getTodosByStatus(userId, status) :
                todoService.getAllTodos(userId);

        return ResponseEntity.ok(ApiResponse.success(todos, "Todos retrieved"));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<Page<TodoDto>>> getTodosPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdOn").descending());
        Page<TodoDto> pagedTodos = todoService.getTodos(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success(pagedTodos, "Paged todos retrieved"));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<org.zemo.omninet.notes.dto.TodoAnalyticsDto>> getAnalytics(
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        org.zemo.omninet.notes.dto.TodoAnalyticsDto analytics = todoService.getAnalytics(userId);
        return ResponseEntity.ok(ApiResponse.success(analytics, "Todo analytics retrieved"));
    }

    @PatchMapping("/{id}/subtask/{subtaskId}")
    public ResponseEntity<ApiResponse<TodoDto>> toggleSubtask(
            @PathVariable Integer id,
            @PathVariable Integer subtaskId,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        TodoDto updated = todoService.toggleSubtask(id, subtaskId, userId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Subtask status updated"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoDto>> getTodoById(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        TodoDto todo = todoService.getTodoById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(todo, "Todo retrieved"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTodo(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        todoService.deleteTodo(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Todo deleted"));
    }
}
