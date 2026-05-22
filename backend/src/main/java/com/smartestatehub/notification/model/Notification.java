package com.smartestatehub.notification.model;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.crm.model.Client;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_notification")
    private Long idNotification;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type")
    private SenderType senderType;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
