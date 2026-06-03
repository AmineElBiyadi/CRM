package com.smartestatehub.notification.repository;

import com.smartestatehub.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByReceiverUser_IdUserOrderByCreatedAtDesc(UUID receiverUserId);

    Optional<Notification> findByIdNotificationAndReceiverUser_IdUser(UUID id, UUID receiverUserId);

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true, n.readAt = :readAt
            WHERE n.receiverUser.idUser = :userId AND n.isRead = false
            """)
    int markAllReadForUser(@Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);
}
