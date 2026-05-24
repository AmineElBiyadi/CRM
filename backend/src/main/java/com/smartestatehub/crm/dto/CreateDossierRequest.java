package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateDossierRequest {
    private UUID idClient; // Identification unique du client
    private ClientType type; // BUYER or SELLER
    
    // Critères
    private Double budgetMin;
    private Double budgetMax;
    private String propertySpecificType; // Appartement, Villa, etc.
    private String preferredArea;
    private Double surfaceM2;
    private Integer floor;
}
