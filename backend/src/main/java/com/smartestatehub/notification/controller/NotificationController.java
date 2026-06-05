package com.smartestatehub.notification.controller;

import com.smartestatehub.notification.dto.NotificationDto;
import com.smartestatehub.notification.dto.SystemNotificationRequest;
import com.smartestatehub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> list(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.listForUserEmail(principal.getName()));
    }

    @PostMapping("/agent")
    public ResponseEntity<NotificationDto> notifyAgent(@RequestBody SystemNotificationRequest request) {
        return ResponseEntity.ok(notificationService.sendSystemNotification(
                request.getReceiverEmail(),
                request.getTitle(),
                request.getMessage()
        ));
    }

    @PostMapping("/admin")
    public ResponseEntity<NotificationDto> notifyAdmin(@RequestBody SystemNotificationRequest request) {
        return ResponseEntity.ok(notificationService.sendSystemNotification(
                request.getReceiverEmail(),
                request.getTitle(),
                request.getMessage()
        ));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markRead(
            @PathVariable UUID id,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.getName()));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        int updated = notificationService.markAllAsRead(principal.getName());
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
