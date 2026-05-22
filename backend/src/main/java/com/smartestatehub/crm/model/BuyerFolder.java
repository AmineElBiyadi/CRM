package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "buyer_folder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuyerFolder {

    @Id
    @Column(name = "id_profile")
    private Long idProfile;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_profile")
    private ClientFolder clientFolder;

    @Column(name = "budget_min")
    private Double budgetMin;

    @Column(name = "budget_max")
    private Double budgetMax;

    @Column(name = "preferred_size_m2")
    private Double preferredSizeM2;

    @Column(name = "preferred_area")
    private String preferredArea;

    @Column(name = "preferred_floor")
    private Integer preferredFloor;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type")
    private PropertyType propertyType;
}
