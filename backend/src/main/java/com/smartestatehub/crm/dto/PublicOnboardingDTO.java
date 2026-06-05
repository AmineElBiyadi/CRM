package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import java.util.UUID;

public class PublicOnboardingDTO {

    public record ClientStep1Request(
        String firstName,
        String lastName,
        String email,
        String phone,
        String source
    ) {}

    public record DossierStep3Request(
        UUID clientId,
        ClientType clientType,
        // Seller fields
        String propertyTitle,
        UUID propertyTypeId,
        String address,
        String city,
        Double price,
        Double surfaceM2,
        Integer numRooms,
        Integer floor,
        // Buyer fields
        Double budgetMin,
        Double budgetMax,
        String preferredArea,
        Double preferredSizeM2,
        Integer preferredFloor
    ) {}
}
