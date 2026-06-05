package com.smartestatehub.notification.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.notification.dto.NotificationDto;
import com.smartestatehub.notification.model.Notification;
import com.smartestatehub.notification.model.SenderType;
import com.smartestatehub.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationDto> listForUserEmail(String email) {
        InternalUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
        return notificationRepository.findByReceiverUser_IdUserOrderByCreatedAtDesc(user.getIdUser())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public NotificationDto notifyAgentFromAdmin(
            UUID agentId,
            String title,
            String message,
            String adminEmail
    ) {
        InternalUser agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent introuvable."));
        InternalUser admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Administrateur introuvable."));

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .senderType(SenderType.INTERNAL_USER)
                .senderUser(admin)
                .receiverUser(agent)
                .build();

        return toDto(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationDto markAsRead(UUID notificationId, String userEmail) {
        InternalUser user = requireUser(userEmail);
        Notification notification = notificationRepository
                .findByIdNotificationAndReceiverUser_IdUser(notificationId, user.getIdUser())
                .orElseThrow(() -> new IllegalArgumentException("Notification introuvable."));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }
        return toDto(notification);
    }

    @Transactional
    public int markAllAsRead(String userEmail) {
        InternalUser user = requireUser(userEmail);
        return notificationRepository.markAllReadForUser(user.getIdUser(), LocalDateTime.now());
    }

    @Transactional
    public NotificationDto sendSystemNotification(
            UUID receiverId,
            String receiverEmail,
            String title,
            String message
    ) {
        InternalUser receiver;
        
        if (receiverId != null) {
            receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new IllegalArgumentException("Destinataire (ID) introuvable : " + receiverId));
        } else if (receiverEmail != null && !receiverEmail.isBlank() && !receiverEmail.equalsIgnoreCase("N/A")) {
            receiver = userRepository.findByEmail(receiverEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Destinataire (Email) introuvable : " + receiverEmail));
        } else {
            throw new IllegalArgumentException("Destinataire non spécifié ou invalide (ID ou Email requis).");
        }

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .senderType(SenderType.SYSTEM)
                .receiverUser(receiver)
                .build();

        return toDto(notificationRepository.save(notification));
    }

    private InternalUser requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
    }

    private NotificationDto toDto(Notification n) {
        String senderName = "Système";
        if (n.getSenderType() == SenderType.INTERNAL_USER && n.getSenderUser() != null) {
            var s = n.getSenderUser();
            senderName = s.getFirstName() + " " + s.getLastName();
        } else if (n.getSenderType() == SenderType.CLIENT && n.getSenderClient() != null) {
            var c = n.getSenderClient();
            senderName = c.getFirstName() + " " + c.getLastName();
        }

        return new NotificationDto(
                n.getIdNotification(),
                n.getTitle(),
                n.getMessage(),
                n.isRead(),
                n.getCreatedAt(),
                senderName
        );
    }
}
