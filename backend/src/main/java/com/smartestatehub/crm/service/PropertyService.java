package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.PropertyDto;
import com.smartestatehub.crm.external.PropertyApiClient;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Property;
import com.smartestatehub.crm.model.PropertyImage;
import com.smartestatehub.crm.model.PropertyType;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.OfferRepository;
import com.smartestatehub.crm.repository.PropertyImageRepository;
import com.smartestatehub.crm.repository.PropertyRepository;
import com.smartestatehub.crm.repository.PropertyTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyTypeRepository propertyTypeRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final DealRepository dealRepository;
    private final OfferRepository offerRepository;
    private final PropertyApiClient propertyApiClient;

    /**
     * Effectue une recherche de biens immobiliers (externe RapidAPI ou mock Maroc de secours).
     */
    public PropertyDto.SearchResponse search(UUID dealId, String city, String propertyType, Double minPrice, Double maxPrice, Integer minRooms, Integer maxRooms, int page) {
        if (dealId != null) {
            Optional<Deal> dealOpt = dealRepository.findById(dealId);
            if (dealOpt.isPresent() && dealOpt.get().getClientFolder() != null && dealOpt.get().getClientFolder().getBuyerFolder() != null) {
                var buyerFolder = dealOpt.get().getClientFolder().getBuyerFolder();
                if (city == null && buyerFolder.getPreferredArea() != null && !buyerFolder.getPreferredArea().isBlank()) {
                    city = buyerFolder.getPreferredArea();
                }
                if (propertyType == null && buyerFolder.getPropertyType() != null) {
                    propertyType = buyerFolder.getPropertyType().getSpecificType();
                }
                if (minPrice == null && buyerFolder.getBudgetMin() != null) {
                    minPrice = buyerFolder.getBudgetMin();
                }
                if (maxPrice == null && buyerFolder.getBudgetMax() != null) {
                    maxPrice = buyerFolder.getBudgetMax();
                }
            }
        }
        PropertyDto.SearchResponse response = propertyApiClient.searchProperties(city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page);
        
        // Exclure les propriétés indisponibles (déjà en négociation chez nous)
        if (response != null && response.getResults() != null) {
            List<String> unavailableUrls = propertyRepository.findAll().stream()
                    .filter(p -> !p.isAvailable() && p.getListingUrl() != null)
                    .map(com.smartestatehub.crm.model.Property::getListingUrl)
                    .collect(java.util.stream.Collectors.toList());

            List<PropertyDto.ExternalResult> filtered = response.getResults().stream()
                    .filter(ext -> ext.getListingUrl() == null || !unavailableUrls.contains(ext.getListingUrl()))
                    .collect(java.util.stream.Collectors.toList());
            response.setResults(filtered);
            response.setTotal(filtered.size());
        }
        
        return response;
    }

    /**
     * Enregistre une propriété externe en base locale et la lie à un dossier client (Deal).
     */
    @Transactional
    public PropertyDto.Response linkPropertyToDeal(UUID dealId, PropertyDto.LinkRequest request) {
        log.info("Liaison de la propriété '{}' au deal ID: {}", request.getTitle(), dealId);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier client (Deal) non trouvé avec l'ID: " + dealId));

        // Résolution du type via les champs envoyés directement par le frontend
        String generalType = request.getPropertyTypeGeneral() != null
                ? request.getPropertyTypeGeneral()
                : "Residential Properties";
        String specificType = request.getPropertyTypeSpecific() != null
                ? request.getPropertyTypeSpecific()
                : "Apartment / Flat";

        final String finalGeneralType = generalType;
        final String finalSpecificType = specificType;

        PropertyType propertyType = propertyTypeRepository.findByGeneralTypeAndSpecificType(generalType, specificType)
                .orElseGet(() -> {
                    log.info("Type de propriété '{} - {}' non trouvé. Création.", finalGeneralType, finalSpecificType);
                    return propertyTypeRepository.save(PropertyType.builder()
                            .generalType(finalGeneralType)
                            .specificType(finalSpecificType)
                            .description("Type importé automatiquement depuis l'API externe")
                            .build());
                });

        // Vérification de doublons par l'url de listing si renseignée
        Optional<Property> existingOpt = Optional.empty();
        if (request.getListingUrl() != null && !request.getListingUrl().trim().isEmpty()) {
            existingOpt = propertyRepository.findByListingUrlAndDeletedAtIsNull(request.getListingUrl());
        }

        Property property;
        if (existingOpt.isPresent()) {
            property = existingOpt.get();
            property.setAvailable(false);
            property.setUnavailableAt(java.time.LocalDateTime.now());
            property.setUnavailableReason("NEGOTIATION");
            property = propertyRepository.save(property);
            log.info("La propriété existe déjà en base de données. ID: {}", property.getIdProperty());
        } else {
            // Création de la nouvelle propriété
            property = Property.builder()
                    .title(request.getTitle())
                    .address(request.getAddress())
                    .city(request.getCity())
                    .price(request.getPrice())
                    .surfaceM2(request.getSurfaceM2())
                    .numRooms(request.getNumRooms())
                    .floor(request.getFloor())
                    .listingUrl(request.getListingUrl())
                    .propertyType(propertyType)
                    .isAvailable(false)
                    .unavailableAt(java.time.LocalDateTime.now())
                    .unavailableReason("NEGOTIATION")
                    .build();

            property = propertyRepository.save(property);

            // Ajout des images si spécifiées
            if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
                List<PropertyImage> images = new ArrayList<>();
                int order = 1;
                for (String url : request.getImageUrls()) {
                    images.add(PropertyImage.builder()
                            .imageUrl(url)
                            .displayOrder(order++)
                            .property(property)
                            .build());
                }
                propertyImageRepository.saveAll(images);
                property.setImages(images);
            }
            log.info("Nouvelle propriété sauvegardée avec succès. ID: {}", property.getIdProperty());
        }

        // Note: Ici, on peut également logguer une interaction automatique sur le deal ou créer une offre de visite
        // Création de l'offre
        com.smartestatehub.crm.model.Offer offer = com.smartestatehub.crm.model.Offer.builder()
                .deal(deal)
                .property(property)
                .offerAmount(property.getPrice() != null ? property.getPrice() : 0.0)
                .status(com.smartestatehub.crm.model.OfferStatus.PENDING)
                .build();
        offerRepository.save(offer);
        log.info("Offre PENDING créée pour le deal {} et la propriété {}", dealId, property.getIdProperty());

        return mapToResponse(property);
    }

    /**
     * Récupère les propriétés déjà enregistrées en base locale.
     * En mode démo/simple, on retourne toutes les propriétés de la ville préférée du deal.
     */
    public List<PropertyDto.Response> getPropertiesByDeal(UUID dealId) {
        log.info("Récupération des propriétés liées au deal ID: {}", dealId);
        // On récupère toutes les propriétés de notre base locale pour la démo
        return propertyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PropertyDto.Response mapToResponse(Property p) {
        List<String> imageUrls = new ArrayList<>();
        if (p.getImages() != null) {
            imageUrls = p.getImages().stream()
                    .map(PropertyImage::getImageUrl)
                    .collect(Collectors.toList());
        }
        if (imageUrls.isEmpty()) {
            imageUrls.add("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80");
        }

        return PropertyDto.Response.builder()
                .idProperty(p.getIdProperty())
                .title(p.getTitle())
                .address(p.getAddress())
                .city(p.getCity())
                .price(p.getPrice())
                .surfaceM2(p.getSurfaceM2())
                .numRooms(p.getNumRooms())
                .floor(p.getFloor())
                .listingUrl(p.getListingUrl())
                .isAvailable(p.isAvailable())
                .imageUrls(imageUrls)
                .build();
    }
}
