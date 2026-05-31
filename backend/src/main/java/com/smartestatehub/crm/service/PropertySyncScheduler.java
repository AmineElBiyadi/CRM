package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.PropertyDto;
import com.smartestatehub.crm.external.PropertyApiClient;
import com.smartestatehub.crm.model.Property;
import com.smartestatehub.crm.model.PropertyImage;
import com.smartestatehub.crm.model.PropertyType;
import com.smartestatehub.crm.repository.PropertyImageRepository;
import com.smartestatehub.crm.repository.PropertyRepository;
import com.smartestatehub.crm.repository.PropertyTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertySyncScheduler {

    private final PropertyApiClient propertyApiClient;
    private final PropertyRepository propertyRepository;
    private final PropertyTypeRepository propertyTypeRepository;
    private final PropertyImageRepository propertyImageRepository;

    private static final List<String> CITIES_TO_SYNC = Arrays.asList("New York", "Los Angeles", "Miami", "Chicago", "Houston");
    private static final List<String> TYPES_TO_SYNC = Arrays.asList("single_family", "condo", "land", "multi_family", "farm", "commercial");

    /**
     * Trigger a sync on startup to ensure the DB has data immediately.
     */
    @PostConstruct
    public void init() {
        log.info("Initialisation : Lancement de la première synchronisation des propriétés...");
        // On lance dans un nouveau thread pour ne pas bloquer le démarrage de l'application
        new Thread(this::syncPropertiesFromExternalApi).start();
    }

    /**
     * Executes every 12 hours (0 0 0/12 * * ?) to keep the DB updated with latest properties
     * without exceeding external API quotas.
     */
    @Scheduled(cron = "0 0 0/12 * * ?")
    @Transactional
    public void syncPropertiesFromExternalApi() {
        log.info("Démarrage de la synchronisation automatique des propriétés depuis l'API...");

        for (String city : CITIES_TO_SYNC) {
            for (String propertyType : TYPES_TO_SYNC) {
                try {
                    log.info("Synchronisation API pour ville: {}, type: {}", city, propertyType);
                    PropertyDto.SearchResponse response = propertyApiClient.searchProperties(
                            city, propertyType, null, null, null, null, 1);

                    if (response != null && response.getResults() != null) {
                        saveExternalProperties(response.getResults(), propertyType);
                    }
                } catch (Exception e) {
                    log.error("Erreur lors de la synchronisation des propriétés pour {} ({}): {}", city, propertyType, e.getMessage());
                }
            }
        }
        
        log.info("Synchronisation automatique des propriétés terminée.");
    }

    private void saveExternalProperties(List<PropertyDto.ExternalResult> externalResults, String requestedApiType) {
        // Map API types to our general/specific types
        String generalType = "Residential Properties";
        String specificType = "House";

        if ("condo".equalsIgnoreCase(requestedApiType) || "apartment".equalsIgnoreCase(requestedApiType)) {
            specificType = "Apartment / Flat";
        } else if ("land".equalsIgnoreCase(requestedApiType)) {
            generalType = "Land";
            specificType = "Vacant Land";
        } else if ("multi_family".equalsIgnoreCase(requestedApiType)) {
            specificType = "Duplex / Triplex";
        } else if ("commercial".equalsIgnoreCase(requestedApiType) || "office".equalsIgnoreCase(requestedApiType)) {
            generalType = "Commercial Properties";
            specificType = "Office Space";
        }

        final String finalGeneral = generalType;
        final String finalSpecific = specificType;

        PropertyType type = propertyTypeRepository.findByGeneralTypeAndSpecificType(generalType, specificType)
                .orElseGet(() -> propertyTypeRepository.save(PropertyType.builder()
                        .generalType(finalGeneral)
                        .specificType(finalSpecific)
                        .description("Type synchronisé depuis API")
                        .build()));

        for (PropertyDto.ExternalResult extProp : externalResults) {
            // Ignore if listingUrl already exists
            if (extProp.getListingUrl() != null && !extProp.getListingUrl().trim().isEmpty()) {
                Optional<Property> existing = propertyRepository.findByListingUrlAndDeletedAtIsNull(extProp.getListingUrl());
                if (existing.isPresent()) {
                    continue;
                }
            }

            Property property = Property.builder()
                    .title(extProp.getTitle())
                    .address(extProp.getAddress())
                    .city(extProp.getCity())
                    .price(extProp.getPrice())
                    .surfaceM2(extProp.getSurfaceM2())
                    .numRooms(extProp.getNumRooms())
                    .floor(extProp.getFloor())
                    .latitude(extProp.getLatitude())
                    .longitude(extProp.getLongitude())
                    .listingUrl(extProp.getListingUrl())
                    .propertyType(type)
                    .isAvailable(true)
                    .build();

            property = propertyRepository.save(property);

            if (extProp.getImageUrls() != null && !extProp.getImageUrls().isEmpty()) {
                List<PropertyImage> images = new ArrayList<>();
                int order = 1;
                for (String url : extProp.getImageUrls()) {
                    images.add(PropertyImage.builder()
                            .imageUrl(url)
                            .displayOrder(order++)
                            .property(property)
                            .build());
                }
                propertyImageRepository.saveAll(images);
                property.setImages(images);
            }
        }
    }
}
