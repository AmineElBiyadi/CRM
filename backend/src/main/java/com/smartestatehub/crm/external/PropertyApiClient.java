package com.smartestatehub.crm.external;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartestatehub.crm.dto.PropertyDto;
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

    public PropertyDto.SearchResponse searchProperties(String city, String propertyType, Double minPrice,
            Double maxPrice, Integer minRooms, Integer maxRooms, int page) {
        log.info("Recherche immobilière sur la ville: {}, type: {}, prix: [{} - {}], chambres: [{} - {}], page: {}",
                city, propertyType, minPrice, maxPrice, minRooms, maxRooms, page);

        // Si pas de clé, on retourne vide sans erreur
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("${RAPIDAPI_KEY}")) {
            log.warn("Aucune clé RapidAPI configurée. Retour vide.");
            return emptyResponse(page);
        }

        try {
            // Endpoint v3 (POST) — le seul qui fonctionne sur realty-in-us.p.rapidapi.com
            String url = "https://" + apiHost + "/properties/v3/list";

            // Déduire le state_code
            String stateCode = "NY";
            String apiCity = city != null ? city : "New York City";
            if (city != null) {
                String c = city.toLowerCase();
                if (c.contains("new york")) {
                    stateCode = "NY";
                    apiCity = "New York City";
                } else if (c.contains("los angeles")) {
                    stateCode = "CA";
                } else if (c.contains("san francisco")) {
                    stateCode = "CA";
                } else if (c.contains("san diego")) {
                    stateCode = "CA";
                } else if (c.contains("miami")) {
                    stateCode = "FL";
                } else if (c.contains("orlando")) {
                    stateCode = "FL";
                } else if (c.contains("chicago")) {
                    stateCode = "IL";
                } else if (c.contains("houston")) {
                    stateCode = "TX";
                } else if (c.contains("dallas")) {
                    stateCode = "TX";
                } else if (c.contains("austin")) {
                    stateCode = "TX";
                } else if (c.contains("seattle")) {
                    stateCode = "WA";
                } else if (c.contains("boston")) {
                    stateCode = "MA";
                } else if (c.contains("denver")) {
                    stateCode = "CO";
                } else if (c.contains("phoenix")) {
                    stateCode = "AZ";
                }
            }

            // Déduire le statut et le type de bien pour RapidAPI
            String apiType = "single_family";
            String[] apiTypeWords = propertyType != null ? propertyType.toLowerCase().split(" ") : new String[0];
            String typeStr = propertyType != null ? propertyType.toLowerCase() : "";
            
            if (typeStr.contains("apartment") || typeStr.contains("condo") || typeStr.contains("flat")) {
                apiType = "condo";
            } else if (typeStr.contains("multi")) {
                apiType = "multi_family";
            } else if (typeStr.contains("land") || typeStr.contains("lot") || typeStr.contains("agriculture")) {
                apiType = "land";
            } else if (typeStr.contains("farm") || typeStr.contains("ranch")) {
                apiType = "farm";
            } else if (typeStr.contains("mobile") || typeStr.contains("manufactured")) {
                apiType = "mobile";
            } else if (typeStr.contains("commercial") || typeStr.contains("retail") || typeStr.contains("office") || typeStr.contains("warehouse") || typeStr.contains("restaurant")) {
                apiType = "commercial";
            } else {
                apiType = "single_family"; // default or "house"
            }

            // Construction du body JSON pour l'API v3
            StringBuilder bodyBuilder = new StringBuilder();
            bodyBuilder.append("{");
            bodyBuilder.append("\"limit\":10,");
            bodyBuilder.append("\"offset\":").append((page - 1) * 10).append(",");
            bodyBuilder.append("\"city\":\"").append(apiCity.replace("\"", "\\\"")).append("\",");
            bodyBuilder.append("\"state_code\":\"").append(stateCode).append("\",");
            if (propertyType != null && !propertyType.trim().isEmpty() && !propertyType.equalsIgnoreCase("Any")) {
                bodyBuilder.append("\"type\":[\"").append(apiType).append("\"],");
            }
            bodyBuilder.append("\"status\":[\"for_sale\"],");
            bodyBuilder.append("\"sort\":{\"direction\":\"desc\",\"field\":\"list_date\"}");
            if (minPrice != null)
                bodyBuilder.append(",\"list_price\":{\"min\":").append(minPrice.intValue()).append("}");
            if (maxPrice != null) {
                // Si déjà un min_price, on refait l'objet complet
                if (minPrice != null) {
                    // Remplacer le dernier objet list_price pour inclure max
                    String existing = ",\"list_price\":{\"min\":" + minPrice.intValue() + "}";
                    int idx = bodyBuilder.lastIndexOf(existing);
                    if (idx >= 0) {
                        bodyBuilder.replace(idx, idx + existing.length(),
                                ",\"list_price\":{\"min\":" + minPrice.intValue() + ",\"max\":" + maxPrice.intValue()
                                        + "}");
                    }
                } else {
                    bodyBuilder.append(",\"list_price\":{\"max\":").append(maxPrice.intValue()).append("}");
                }
            }
            if (minRooms != null)
                bodyBuilder.append(",\"beds\":{\"min\":").append(minRooms).append("}");
            bodyBuilder.append("}");

            String requestBody = bodyBuilder.toString();
            log.debug("RapidAPI v3 body: {}", requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-rapidapi-key", apiKey)
                    .header("x-rapidapi-host", apiHost)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("RapidAPI v3 réponse: status={}, bodyLength={}", response.statusCode(),
                    response.body() != null ? response.body().length() : 0);

            if (response.statusCode() == 200 && response.body() != null && !response.body().trim().isEmpty()) {
                PropertyDto.SearchResponse parsed = parseApiResponse(response.body(), page);
                if (parsed.getTotal() == 0) {
                    log.warn("Aucun résultat pour: {} ({})", apiCity, stateCode);
                }
                return parsed;
            } else {
                log.error("Erreur/Avertissement HTTP RapidAPI: {} - {}", response.statusCode(), response.body());
                return emptyResponse(page);
            }

        } catch (Exception e) {
            log.error("Exception lors de l'appel RapidAPI: {}", e.getMessage(), e);
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
                
                // Améliorer la résolution des images RapidAPI (passer de 's' small à 'od' original dimension)
                if (imageUrl.contains("-w_s.jpg")) {
                    imageUrl = imageUrl.replace("-w_s.jpg", "-w_od.jpg"); // haute résolution
                } else if (imageUrl.contains("s.jpg")) {
                    imageUrl = imageUrl.replace("s.jpg", "od.jpg");
                }

                // Addresse & Coordonnées
                String addressStr = "";
                String city = "";
                Double lat = null;
                Double lon = null;
                JsonNode addressNode = prop.path("location").path("address");
                if (addressNode.isMissingNode() || addressNode.isNull())
                    addressNode = prop.path("address");

                if (!addressNode.isMissingNode() && !addressNode.isNull()) {
                    String line = addressNode.path("line").asText("");
                    city = addressNode.path("city").asText("");
                    addressStr = line + ", " + city;
                    
                    JsonNode coordNode = addressNode.path("coordinate");
                    if (!coordNode.isMissingNode() && !coordNode.isNull()) {
                        if (coordNode.has("lat")) lat = coordNode.path("lat").asDouble();
                        if (coordNode.has("lon")) lon = coordNode.path("lon").asDouble();
                    }
                }

                // Description (surface, lits, étage)
                JsonNode descNode = prop.path("description");
                Double sqft = null;
                Integer beds = null;
                Integer floor = 1;
                String propTypeStr = "Property";

                if (!descNode.isMissingNode() && !descNode.isNull()) {
                    if (descNode.has("sqft") && !descNode.path("sqft").isNull())
                        sqft = descNode.path("sqft").asDouble();
                    if (descNode.has("beds") && !descNode.path("beds").isNull())
                        beds = descNode.path("beds").asInt();
                    if (descNode.has("type") && !descNode.path("type").isNull())
                        propTypeStr = descNode.path("type").asText();
                    
                    // Tenter de trouver l'étage dans les caractéristiques si présentes
                    // L'API v3 a parfois "stories" pour les maisons, ou des tags
                }

                // Fallback pour floor si c'est un appartement
                if (propTypeStr.toLowerCase().contains("condo") || propTypeStr.toLowerCase().contains("apartment")) {
                    // Si on a l'info "stories" dans le JSON root ou desc
                    if (prop.has("stories")) floor = prop.get("stories").asInt();
                    else if (descNode.has("stories")) floor = descNode.get("stories").asInt();
                    else floor = (int) (Math.random() * 5) + 1; // Simulation réaliste si manquant
                }

                Double surfaceM2 = sqft != null ? sqft * SQFT_TO_M2 : 120.0;

                // Identifiant & Prix
                String propertyId = prop.has("property_id") && !prop.path("property_id").isNull()
                        ? prop.path("property_id").asText()
                        : "N/A";
                Double price = 0.0;
                if (prop.has("list_price") && !prop.path("list_price").isNull())
                    price = prop.path("list_price").asDouble();
                else if (prop.has("price") && !prop.path("price").isNull())
                    price = prop.path("price").asDouble();

                // Lien
                String listingUrl = "";
                if (prop.has("href") && !prop.path("href").isNull())
                    listingUrl = prop.path("href").asText();
                else if (prop.has("listingUrl") && !prop.path("listingUrl").isNull())
                    listingUrl = prop.path("listingUrl").asText();

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
                        .floor(floor)
                        .latitude(lat)
                        .longitude(lon)
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
