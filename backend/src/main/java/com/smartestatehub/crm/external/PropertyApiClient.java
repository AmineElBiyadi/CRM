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
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
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

        // Si pas de clé, on retourne vide sans erreur
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${RAPIDAPI_KEY}")) {
            log.warn("Aucune clé RapidAPI configurée (${RAPIDAPI_KEY} manquante). Retour vide.");
            return emptyResponse(page);
        }

        try {
            // RapidAPI Realty in US ou autre API configurée via le host.
            // On s'adapte dynamiquement selon l'API choisie par l'utilisateur.
            String url = "https://" + apiHost + "/properties/v2/list-for-sale";
            
            // Construction des query params (avec encodage URL pour éviter les espaces)
            String encodedCity = URLEncoder.encode(city != null ? city : "Casablanca", StandardCharsets.UTF_8);
            StringBuilder urlBuilder = new StringBuilder(url);
            urlBuilder.append("?city=").append(encodedCity);
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

            if (response.statusCode() == 200 && response.body() != null && !response.body().trim().isEmpty()) {
                return parseApiResponse(response.body(), page);
            } else {
                log.error("Erreur/Avertissement HTTP RapidAPI: {} - {}", response.statusCode(), response.body());
                return emptyResponse(page);
            }

        } catch (Exception e) {
            log.error("Exception lors de l'appel RapidAPI: {}", e.getMessage());
            return emptyResponse(page);
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

    private PropertyDto.SearchResponse emptyResponse(int page) {
        return PropertyDto.SearchResponse.builder()
                .results(new ArrayList<>())
                .total(0)
                .page(page)
                .pageSize(10)
                .build();
    }
}
