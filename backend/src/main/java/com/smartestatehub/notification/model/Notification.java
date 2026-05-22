package com.smartestatehub.notification.model;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.crm.model.Client;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_notification", nullable = false, updatable = false)
    private UUID idNotification;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type")
    private SenderType senderType;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Sender can be a Client or an InternalUser (only one will be non-null)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_client_id")
    private Client senderClient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id")
    private InternalUser senderUser;

    // Receiver can be a Client or an InternalUser (only one will be non-null)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_client_id")
    private Client receiverClient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_user_id")
    private InternalUser receiverUser;
}
