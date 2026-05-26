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
            
            // Déduire un state_code à partir de la ville pour éviter l'erreur 204
            String stateCode = "NY";
            String rapidApiCity = city != null ? city : "Casablanca";
            if (city != null) {
                String c = city.toLowerCase();
                if (c.contains("new york")) {
                    stateCode = "NY";
                    rapidApiCity = "New York City";
                }
                else if (c.contains("los angeles") || c.contains("san diego") || c.contains("san francisco")) stateCode = "CA";
                else if (c.contains("miami") || c.contains("orlando") || c.contains("tampa")) stateCode = "FL";
                else if (c.contains("chicago")) stateCode = "IL";
                else if (c.contains("houston") || c.contains("dallas") || c.contains("austin")) stateCode = "TX";
            }
            
            // Construction des query params (avec encodage URL pour éviter les espaces)
            String encodedCity = URLEncoder.encode(rapidApiCity, StandardCharsets.UTF_8);
            StringBuilder urlBuilder = new StringBuilder(url);
            urlBuilder.append("?state_code=").append(stateCode);
            urlBuilder.append("&city=").append(encodedCity);
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
                PropertyDto.SearchResponse parsed = parseApiResponse(response.body(), page);
                if (parsed.getTotal() == 0) return emptyResponse(page);
                return parsed;
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
        JsonNode root = objectMapper.readTree(responseBody);
        List<PropertyDto.ExternalResult> results = new ArrayList<>();
        
        JsonNode dataNode = root.path("data").path("home_search");
        JsonNode propertiesNode;
        if (!dataNode.isMissingNode() && !dataNode.path("results").isMissingNode()) {
            propertiesNode = dataNode.path("results");
        } else {
            propertiesNode = root.path("properties");
        }
        
        int totalCount = 0;
        if (!dataNode.isMissingNode() && dataNode.has("count")) {
            totalCount = dataNode.path("count").asInt();
        } else if (root.has("meta")) {
            totalCount = root.path("meta").path("returned_rows").asInt();
        } else {
            totalCount = propertiesNode.size();
        }

        if (propertiesNode.isArray()) {
            for (JsonNode prop : propertiesNode) {
                // Image
                String imageUrl = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
                JsonNode photoNode = prop.path("primary_photo");
                if (!photoNode.isMissingNode() && photoNode.has("href") && !photoNode.path("href").isNull()) {
                    imageUrl = photoNode.path("href").asText();
                } else if (prop.has("photos") && prop.path("photos").isArray() && prop.path("photos").size() > 0) {
                    imageUrl = prop.path("photos").get(0).path("href").asText();
                }
                
                // Addresse
                String addressStr = "";
                String city = "";
                JsonNode addressNode = prop.path("location").path("address");
                if (addressNode.isMissingNode() || addressNode.isNull()) addressNode = prop.path("address");
                
                if (!addressNode.isMissingNode() && !addressNode.isNull()) {
                    String line = addressNode.path("line").asText("");
                    city = addressNode.path("city").asText("");
                    addressStr = line + ", " + city;
                }
                
                // Description (surface, lits)
                JsonNode descNode = prop.path("description");
                Double sqft = null;
                Integer beds = null;
                String propTypeStr = "Property";
                
                if (!descNode.isMissingNode() && !descNode.isNull()) {
                    if (descNode.has("sqft") && !descNode.path("sqft").isNull()) sqft = descNode.path("sqft").asDouble();
                    if (descNode.has("beds") && !descNode.path("beds").isNull()) beds = descNode.path("beds").asInt();
                    if (descNode.has("type") && !descNode.path("type").isNull()) propTypeStr = descNode.path("type").asText();
                } else {
                    if (prop.has("sqft") && !prop.path("sqft").isNull()) sqft = prop.path("sqft").asDouble();
                    if (prop.has("beds") && !prop.path("beds").isNull()) beds = prop.path("beds").asInt();
                    if (prop.has("prop_type") && !prop.path("prop_type").isNull()) propTypeStr = prop.path("prop_type").asText();
                }

                Double surfaceM2 = sqft != null ? sqft * SQFT_TO_M2 : 120.0;
                
                // Identifiant & Prix
                String propertyId = prop.has("property_id") && !prop.path("property_id").isNull() ? prop.path("property_id").asText() : "N/A";
                Double price = 0.0;
                if (prop.has("list_price") && !prop.path("list_price").isNull()) price = prop.path("list_price").asDouble();
                else if (prop.has("price") && !prop.path("price").isNull()) price = prop.path("price").asDouble();

                // Lien
                String listingUrl = "";
                if (prop.has("href") && !prop.path("href").isNull()) listingUrl = prop.path("href").asText();
                else if (prop.has("listingUrl") && !prop.path("listingUrl").isNull()) listingUrl = prop.path("listingUrl").asText();

                if (!listingUrl.isEmpty() && !listingUrl.startsWith("http")) {
                    listingUrl = "https://www.realtor.com" + (listingUrl.startsWith("/") ? "" : "/") + listingUrl;
                } else if (listingUrl.isEmpty()) {
                    listingUrl = "https://www.realtor.com";
                }

                results.add(PropertyDto.ExternalResult.builder()
                        .externalId(propertyId)
                        .title(propTypeStr + " - " + city)
                        .address(addressStr)
                        .city(city)
                        .price(price)
                        .surfaceM2(Math.round(surfaceM2 * 10.0) / 10.0)
                        .numRooms(beds != null ? beds : 3)
                        .floor(1)
                        .listingUrl(listingUrl)
                        .source("RapidAPI (" + apiHost + ")")
                        .imageUrls(List.of(imageUrl))
                        .build());
            }
        }

        return PropertyDto.SearchResponse.builder()
                .results(results)
                .total(totalCount > 0 ? totalCount : results.size())
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
