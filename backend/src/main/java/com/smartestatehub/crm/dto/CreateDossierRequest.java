package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateDossierRequest {
    private UUID idClient;
    private ClientType type; // BUYER or SELLER

    // ── BUYER fields (préférences) ───────────────────────────────────────────
    private Double budgetMin;
    private Double budgetMax;
    private String propertySpecificType; // Appartement, Villa, etc.
    private String preferredArea;
    private Double surfaceM2;
    private Integer floor;

    // ── SELLER fields (caractéristiques du bien à vendre) ───────────────────
    private String propertyTitle;   // ex: "Villa 5 pièces Anfa"
    private String address;
    private String city;
    private Double askingPrice;     // prix demandé par le vendeur
    private Double propertySurfaceM2;
    private Integer numRooms;
    private Integer propertyFloor;
    private List<String> propertyImageUrls; // base64 or external URLs
}
