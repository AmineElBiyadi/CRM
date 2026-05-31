package com.smartestatehub.crm.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO correspondant à la structure de l'API RapidAPI "Realty in US".
 * On ignore les champs inutiles pour ne garder que l'essentiel.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RapidApiPropertyDto {

    @JsonProperty("property_id")
    private String propertyId;

    @JsonProperty("prop_type")
    private String propType;

    private Double price;

    @JsonProperty("beds")
    private Integer beds;

    @JsonProperty("baths")
    private Integer baths;

    @JsonProperty("sqft")
    private Double sqft;

    @JsonProperty("address")
    private AddressDto address;

    @JsonProperty("photos")
    private List<PhotoDto> photos;

    @JsonProperty("rdc_web_url")
    private String listingUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AddressDto {
        private String line;
        private String city;
        private String state;
        @JsonProperty("postal_code")
        private String postalCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PhotoDto {
        private String href;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ResponseWrapper {
        private List<RapidApiPropertyDto> properties;
        @JsonProperty("count")
        private Integer totalCount;
    }
}
