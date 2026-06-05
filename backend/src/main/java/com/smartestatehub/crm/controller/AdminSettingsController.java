package com.smartestatehub.crm.controller;

import com.smartestatehub.auth.model.Role;
import com.smartestatehub.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSettingsController {

    private final UserRepository userRepository;

    @GetMapping("/primary-email")
    public ResponseEntity<Map<String, String>> getPrimaryAdminEmail() {
        return userRepository.findByRoleOrderByLastNameAsc(Role.ADMIN).stream()
                .findFirst()
                .map(admin -> ResponseEntity.ok(Map.of("email", admin.getEmail())))
                .orElse(ResponseEntity.notFound().build());
    }
}
