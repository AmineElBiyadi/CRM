package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_property")
    private Long idProperty;

    @Column(nullable = false)
    private String title;

    private String address;
    private String city;
    private Double price;

    @Column(name = "surface_m2")
    private Double surfaceM2;

    @Column(name = "num_rooms")
    private Integer numRooms;

    private Integer floor;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false)
    private PropertyType propertyType;

    @Column(name = "is_available", nullable = false)
    private boolean isAvailable;

    @Column(name = "listing_url")
    private String listingUrl;

    @Column(name = "unavailable_at")
    private LocalDateTime unavailableAt;

    @Column(name = "unavailable_reason")
    private String unavailableReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_seller_profile")
    private SellerFolder sellerFolder;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<PropertyImage> images;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        isAvailable = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
