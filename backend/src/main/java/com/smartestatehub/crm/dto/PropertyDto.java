package com.smartestatehub.crm.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

public class PropertyDto {

    /**
     * Request : lier une propriété externe à un deal.
     * Ces données viennent soit de la recherche API soit d'une saisie manuelle.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkRequest {
        private String externalId;            // ID externe de l'API (déduplication)
        private String title;
        private String address;
        private String city;
        private Double price;
        private Double surfaceM2;
        private Integer numRooms;
        private Integer floor;
        private String listingUrl;
        private String propertyTypeGeneral;   // ex : "Residential Properties"
        private String propertyTypeSpecific;  // ex : "Apartment / Flat"
        /** URLs des photos récupérées depuis l'API externe */
        private List<String> imageUrls;
    }

    /**
     * Response : propriété enregistrée en base.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID idProperty;
        private UUID idOffer;                 // ID de l'offre associée au deal
        private String offerStatus;           // Statut de l'offre (PENDING, ACCEPTED, REJECTED)
        private String title;
        private String address;
        private String city;
        private Double price;
        private Double surfaceM2;
        private Integer numRooms;
        private Integer floor;
        private String listingUrl;
        private boolean isAvailable;
        private List<String> imageUrls;
    }

    /**
     * Résultat brut provenant de l'API externe (format normalisé côté backend).
     * Le frontend reçoit ce format pour la recherche.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalResult {
        private String externalId;
        private String title;
        private String address;
        private String city;
        private Double price;
        private Double surfaceM2;
        private Integer numRooms;
        private Integer floor;
        private String listingUrl;
        private String source;          // "Avito", "Mubawab", "RapidAPI", …
        private List<String> imageUrls;
        private Double latitude;
        private Double longitude;
    }

    /**
     * Enveloppe de réponse paginée pour la recherche.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResponse {
        private List<ExternalResult> results;
        private int total;
        private int page;
        private int pageSize;
    }
}
