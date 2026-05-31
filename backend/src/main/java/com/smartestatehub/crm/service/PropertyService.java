package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.PropertyDto;
import com.smartestatehub.crm.external.PropertyApiClient;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.*;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
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
     * Effectue une recherche de biens immobiliers dans la base de données locale.
     */
    public PropertyDto.SearchResponse search(UUID dealId, String city, String propertyType, Double minPrice, Double maxPrice, Integer minRooms, Integer maxRooms, Integer floor, int page) {
        log.info("Recherche locale : ville={}, type={}, prix=[{} - {}], chambres=[{} - {}], etage={}, page={}",
                city, propertyType, minPrice, maxPrice, minRooms, maxRooms, floor, page);

        Specification<Property> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isNull(root.get("deletedAt")));
            predicates.add(cb.isTrue(root.get("isAvailable")));

            if (city != null && !city.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase() + "%"));
            }
            if (propertyType != null && !propertyType.isBlank() && !propertyType.equalsIgnoreCase("Any")) {
                predicates.add(cb.like(cb.lower(root.get("propertyType").get("specificType")), "%" + propertyType.toLowerCase() + "%"));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            if (minRooms != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("numRooms"), minRooms));
            }
            if (maxRooms != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("numRooms"), maxRooms));
            }
            if (floor != null) {
                predicates.add(cb.equal(root.get("floor"), floor));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Property> propertyPage = propertyRepository.findAll(spec, PageRequest.of(page - 1, 10));

        List<PropertyDto.ExternalResult> results = propertyPage.getContent().stream()
                .map(p -> PropertyDto.ExternalResult.builder()
                        .externalId(p.getIdProperty().toString())
                        .title(p.getTitle())
                        .address(p.getAddress())
                        .city(p.getCity())
                        .price(p.getPrice())
                        .surfaceM2(p.getSurfaceM2())
                        .numRooms(p.getNumRooms())
                        .floor(p.getFloor())
                        .latitude(p.getLatitude())
                        .longitude(p.getLongitude())
                        .listingUrl(p.getListingUrl())
                        .source("Local Database")
                        .imageUrls(p.getImages() != null ? p.getImages().stream().map(PropertyImage::getImageUrl).collect(Collectors.toList()) : new ArrayList<>())
                        .build())
                .collect(Collectors.toList());

        return PropertyDto.SearchResponse.builder()
                .results(results)
                .total((int) propertyPage.getTotalElements())
                .page(page)
                .pageSize(10)
                .build();
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
            property.setUnavailableReason(PropertyUnavailableReason.NEGOTIATION);
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
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .listingUrl(request.getListingUrl())
                    .propertyType(propertyType)
                    .isAvailable(false)
                    .unavailableAt(java.time.LocalDateTime.now())
                    .unavailableReason(PropertyUnavailableReason.NEGOTIATION)
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
     * Récupère les propriétés déjà enregistrées en base locale liées à un deal spécifique via ses offres.
     */
    public List<PropertyDto.Response> getPropertiesByDeal(UUID dealId) {
        log.info("Récupération des propriétés liées au deal ID: {}", dealId);
        
        List<com.smartestatehub.crm.model.Offer> offers = offerRepository.findByDeal_IdDeal(dealId);
        return offers.stream()
                .map(offer -> {
                    Property p = offer.getProperty();
                    PropertyDto.Response resp = mapToResponse(p);
                    resp.setIdOffer(offer.getIdOffer());
                    resp.setOfferStatus(offer.getStatus().name());
                    return resp;
                })
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
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .listingUrl(p.getListingUrl())
                .isAvailable(p.isAvailable())
                .imageUrls(imageUrls)
                .build();
    }
}
