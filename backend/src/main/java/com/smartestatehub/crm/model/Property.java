package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_property", updatable = false, nullable = false)
    private UUID idProperty;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_property_type", nullable = false)
    private PropertyType propertyType;

    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private boolean isAvailable = true;

    @Column(name = "listing_url")
    private String listingUrl;

    @Column(name = "unavailable_at")
    private LocalDateTime unavailableAt;

    @Column(name = "unavailable_reason")
    private String unavailableReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_seller_profile")
    private SellerFolder sellerFolder;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<PropertyImage> images;
}
