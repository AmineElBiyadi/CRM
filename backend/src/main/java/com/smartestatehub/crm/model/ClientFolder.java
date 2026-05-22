package com.smartestatehub.crm.model;

import com.smartestatehub.auth.model.InternalUser;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "client_folder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientFolder {

    @Id
    @Column(name = "id_profile")
    private Long idProfile;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_profile")
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_type", nullable = false)
    private ClientType clientType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private InternalUser createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToOne(mappedBy = "clientFolder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BuyerFolder buyerFolder;

    @OneToOne(mappedBy = "clientFolder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SellerFolder sellerFolder;

    @OneToMany(mappedBy = "clientFolder", cascade = CascadeType.ALL)
    private List<Deal> deals;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
