package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

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
    private UUID idProfile;

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

    /**
     * Rules for preferredFloor:
     *  0 = ground floor
     *  n = number of the floor
     * -1 = have no problem with any floor
     */
    @Builder.Default
    @Column(name = "preferred_floor")
    private Integer preferredFloor = -1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_property_type")
    private PropertyType propertyType;
}
