package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateDossierRequest {
    private ClientType type;
    
    // Buyer Specifics
    private Double budgetMin;
    private Double budgetMax;
    private String preferredArea;
    private Double preferredSizeM2;
    private Integer preferredFloor;
    private String propertySpecificType;

    // Seller Specifics
    private String propertyTitle;
    private String address;
    private String city;
    private Double askingPrice;
    private Double propertySurfaceM2;
    private Integer numRooms;
    private Integer propertyFloor;
    private List<String> propertyImageUrls;
}
