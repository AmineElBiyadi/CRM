package com.smartestatehub.crm.model;

import com.smartestatehub.auth.model.InternalUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "client_folder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_profile", updatable = false, nullable = false)
    private UUID idProfile;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_client", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent")
    private InternalUser assignedAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_agent_id")
    private InternalUser createdByAgent;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_type", nullable = false, length = 10)
    private ClientType clientType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToOne(mappedBy = "clientFolder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BuyerFolder buyerFolder;

    @OneToOne(mappedBy = "clientFolder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SellerFolder sellerFolder;

    @OneToMany(mappedBy = "clientFolder", cascade = CascadeType.ALL)
    private List<Deal> deals;
}
