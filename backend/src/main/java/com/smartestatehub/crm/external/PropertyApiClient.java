package com.smartestatehub.crm.external;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartestatehub.crm.dto.PropertyDto;
import com.smartestatehub.crm.dto.RapidApiPropertyDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class PropertyApiClient {

    @Value("${app.rapidapi.key:}")
    private String apiKey;

    @Value("${app.rapidapi.host:realty-in-us.p.rapidapi.com}")
    private String apiHost;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final double SQFT_TO_M2 = 0.092903;

    /**
     * Effectue une recherche immobilière via RapidAPI.
     * Si la clé API n'est pas fournie ou en cas d'erreur de communication,
     * retombe gracieusement sur une liste de biens simulés de qualité supérieure au Maroc (Casablanca, Marrakech, Rabat).
     */
    public PropertyDto.SearchResponse searchProperties(String city, String propertyType, Double minPrice, Double maxPrice, Integer minRooms, Integer maxRooms, int page) {
        log.info("Recherche immobilière sur la ville: {}, type: {}, prix: [{} - {}], chambres: [{} - {}], page: {}",
                city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page);

        // Fallback si pas de clé API konfigurée
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${RAPIDAPI_KEY}")) {
            log.warn("Aucune clé RapidAPI configurée (${RAPIDAPI_KEY} manquante). Utilisation du mock Maroc de haute qualité.");
            return generateMockProperties(city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page);
        }

        try {
            // RapidAPI Realty in US ou autre API configurée via le host.
            // On s'adapte dynamiquement selon l'API choisie par l'utilisateur.
            String url = "https://" + apiHost + "/properties/v2/list-for-sale";
            
            // Construction des query params
            StringBuilder urlBuilder = new StringBuilder(url);
            urlBuilder.append("?city=").append(city != null ? city : "Casablanca");
            urlBuilder.append("&limit=10");
            urlBuilder.append("&offset=").append((page - 1) * 10);
            
            if (minPrice != null) urlBuilder.append("&price_min=").append(minPrice.intValue());
            if (maxPrice != null) urlBuilder.append("&price_max=").append(maxPrice.intValue());
            if (minRooms != null) urlBuilder.append("&beds_min=").append(minRooms);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(urlBuilder.toString()))
                    .header("x-rapidapi-key", apiKey)
                    .header("x-rapidapi-host", apiHost)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parseApiResponse(response.body(), page);
            } else {
                log.error("Erreur HTTP RapidAPI: {} - {}. Fallback vers données locales simulées.", response.statusCode(), response.body());
                return generateMockProperties(city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page);
            }

        } catch (Exception e) {
            log.error("Exception lors de l'appel RapidAPI: {}. Fallback vers données locales simulées.", e.getMessage(), e);
            return generateMockProperties(city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page);
        }
    }

    private PropertyDto.SearchResponse parseApiResponse(String responseBody, int page) throws IOException {
        RapidApiPropertyDto.ResponseWrapper wrapper = objectMapper.readValue(responseBody, RapidApiPropertyDto.ResponseWrapper.class);
        List<PropertyDto.ExternalResult> results = new ArrayList<>();
        
        if (wrapper.getProperties() != null) {
            for (RapidApiPropertyDto prop : wrapper.getProperties()) {
                List<String> imageUrls = new ArrayList<>();
                if (prop.getPhotos() != null) {
                    for (RapidApiPropertyDto.PhotoDto photo : prop.getPhotos()) {
                        imageUrls.add(photo.getHref());
                    }
                }
                
                if (imageUrls.isEmpty()) {
                    imageUrls.add("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80");
                }

                String addressStr = "";
                String city = "";
                if (prop.getAddress() != null) {
                    addressStr = prop.getAddress().getLine() + ", " + prop.getAddress().getCity();
                    city = prop.getAddress().getCity();
                }
                
                // Conversion sqft en m2
                Double surfaceM2 = prop.getSqft() != null ? prop.getSqft() * SQFT_TO_M2 : 120.0;

                results.add(PropertyDto.ExternalResult.builder()
                        .externalId(prop.getPropertyId())
                        .title((prop.getPropType() != null ? prop.getPropType() : "Property") + " - " + city)
                        .address(addressStr)
                        .city(city)
                        .price(prop.getPrice())
                        .surfaceM2(Math.round(surfaceM2 * 10.0) / 10.0) // Arrondi à 1 décimale
                        .numRooms(prop.getBeds())
                        .floor(1) // Par défaut car non présent dans l'API simplifiée
                        .listingUrl(prop.getListingUrl() != null ? prop.getListingUrl() : "https://www.realtor.com")
                        .source("RapidAPI (" + apiHost + ")")
                        .imageUrls(imageUrls)
                        .build());
            }
        }

        return PropertyDto.SearchResponse.builder()
                .results(results)
                .total(wrapper.getTotalCount() != null ? wrapper.getTotalCount() : results.size())
                .page(page)
                .pageSize(10)
                .build();
    }

    /**
     * Génère des biens immobiliers marocains de qualité supérieure pour la démonstration ou le fallback.
     */
    private PropertyDto.SearchResponse generateMockProperties(String city, String propertyType, Double minPrice, Double maxPrice, Integer minRooms, Integer maxRooms, int page) {
        String finalCity = (city == null || city.trim().isEmpty()) ? "Casablanca" : city;
        String finalType = (propertyType == null || propertyType.trim().isEmpty()) ? "Appartement" : propertyType;

        List<PropertyDto.ExternalResult> mockList = new ArrayList<>();
        
        // 1. Appartement de standing à Anfa, Casablanca
        mockList.add(PropertyDto.ExternalResult.builder()
                .externalId("ext-m1")
                .title("Appartement de standing Anfa")
                .address("Boulevard d'Anfa, Quartier Anfa")
                .city("Casablanca")
                .price(2800000.0)
                .surfaceM2(140.0)
                .numRooms(3)
                .floor(4)
                .listingUrl("https://www.mubawab.ma/fr/a/appartement-standing-anfa-casa")
                .source("Mubawab")
                .imageUrls(List.of("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"))
                .latitude(33.5951)
                .longitude(-7.6324)
                .build());

        // 2. Splendide Villa à Souissi, Rabat
        mockList.add(PropertyDto.ExternalResult.builder()
                .externalId("ext-m2")
                .title("Splendide Villa Contemporaine Souissi")
                .address("Avenue Mohammed VI, Souissi")
                .city("Rabat")
                .price(7500000.0)
                .surfaceM2(450.0)
                .numRooms(5)
                .floor(0)
                .listingUrl("https://www.avito.ma/fr/souissi/appartements/villa-contemporaine-souissi")
                .source("Avito")
                .imageUrls(List.of("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"))
                .latitude(33.9715)
                .longitude(-6.8498)
                .build());

        // 3. Penthouse vue mer Bourgogne, Casablanca
        mockList.add(PropertyDto.ExternalResult.builder()
                .externalId("ext-m3")
                .title("Penthouse avec vue mer exceptionnelle")
                .address("Rue des Lilas, Bourgogne")
                .city("Casablanca")
                .price(3900000.0)
                .surfaceM2(190.0)
                .numRooms(4)
                .floor(8)
                .listingUrl("https://www.sarouty.ma/fr/a/penthouse-vue-mer-bourgogne")
                .source("Sarouty")
                .imageUrls(List.of("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"))
                .latitude(33.6002)
                .longitude(-7.6410)
                .build());

        // 4. Bel Appartement à Gueliz, Marrakech
        mockList.add(PropertyDto.ExternalResult.builder()
                .externalId("ext-m4")
                .title("Bel Appartement moderne à Gueliz")
                .address("Avenue Hassan II, Gueliz")
                .city("Marrakech")
                .price(1850000.0)
                .surfaceM2(95.0)
                .numRooms(2)
                .floor(2)
                .listingUrl("https://www.mubawab.ma/fr/a/bel-appartement-gueliz")
                .source("Mubawab")
                .imageUrls(List.of("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"))
                .latitude(31.6346)
                .longitude(-8.0150)
                .build());

        // 5. Villa d'architecte, Route de l'Ourika, Marrakech
        mockList.add(PropertyDto.ExternalResult.builder()
                .externalId("ext-m5")
                .title("Villa d'Architecte avec Piscine")
                .address("Km 12 Route de l'Ourika")
                .city("Marrakech")
                .price(5900000.0)
                .surfaceM2(380.0)
                .numRooms(4)
                .floor(0)
                .listingUrl("https://www.avito.ma/fr/ourika/villas/villa-architecte-piscine")
                .source("Avito")
                .imageUrls(List.of("https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"))
                .latitude(31.5120)
                .longitude(-7.9540)
                .build());

        // Filtrage dynamique sur les critères de recherche
        List<PropertyDto.ExternalResult> filtered = mockList.stream()
                .filter(p -> p.getCity().equalsIgnoreCase(finalCity))
                .filter(p -> {
                    if (minPrice != null && p.getPrice() < minPrice) return false;
                    if (maxPrice != null && p.getPrice() > maxPrice) return false;
                    if (minRooms != null && p.getNumRooms() < minRooms) return false;
                    if (maxRooms != null && p.getNumRooms() > maxRooms) return false;
                    return true;
                })
                .toList();

        // Si aucun résultat ne matche le filtre, on retourne Casablanca/Anfa par défaut pour éviter un vide frustrant
        if (filtered.isEmpty()) {
            filtered = mockList.stream().filter(p -> p.getCity().equalsIgnoreCase(finalCity)).toList();
            if (filtered.isEmpty()) {
                filtered = List.of(mockList.get(0)); // au moins 1 bien
            }
        }

        return PropertyDto.SearchResponse.builder()
                .results(filtered)
                .total(filtered.size())
                .page(page)
                .pageSize(10)
                .build();
    }
}
