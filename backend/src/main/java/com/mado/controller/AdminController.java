package com.mado.controller;

import com.mado.dto.AdminStatsResponse;
import com.mado.dto.CategoryWriteRequest;
import com.mado.dto.UserBanRequest;
import com.mado.entity.Category;
import com.mado.entity.User;
import com.mado.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.stats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> users(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.searchUsers(q, pageable));
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<Void> ban(@PathVariable UUID id, @RequestBody(required = false) UserBanRequest body) {
        adminService.banUser(id, body != null ? body.getReason() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<Void> unban(@PathVariable UUID id) {
        adminService.unbanUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/verify")
    public ResponseEntity<Void> verify(@PathVariable UUID id) {
        adminService.verifyUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<Page<Category>> categories(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(adminService.listCategories(pageable));
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryWriteRequest body) {
        return ResponseEntity.ok(adminService.createCategory(body));
    }

    @PatchMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryWriteRequest body) {
        return ResponseEntity.ok(adminService.updateCategory(id, body));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        adminService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
