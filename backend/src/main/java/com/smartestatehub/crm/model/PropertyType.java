package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "property_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_property_type", updatable = false, nullable = false)
    private UUID idPropertyType;

    @Column(name = "general_type", nullable = false)
    private String generalType;

    @Column(name = "specific_type", nullable = false)
    private String specificType;

    @Column(name = "description", length = 1000)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
