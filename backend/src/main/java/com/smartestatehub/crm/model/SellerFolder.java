package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "seller_folder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerFolder {

    @Id
    @Column(name = "id_profile")
    private Long idProfile;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_profile")
    private ClientFolder clientFolder;

    @OneToMany(mappedBy = "sellerFolder", cascade = CascadeType.ALL)
    private List<Property> properties;
}
