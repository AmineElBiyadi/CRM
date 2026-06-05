package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.model.Property;
import com.smartestatehub.crm.repository.PropertyRepository;
import com.smartestatehub.crm.dto.PropertyDto;
import com.smartestatehub.crm.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/properties", "/api/public/properties"})
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PropertyController {

    private final PropertyRepository propertyRepository;
    private final PropertyService propertyService;
    private final com.smartestatehub.ai.service.PropertyRecommendationService propertyRecommendationService;

    @GetMapping("/latest")
    public ResponseEntity<PropertyDto.Response> getLatestProperty() {
        return propertyRepository.findFirstByOrderByCreatedAtDesc()
                .map(p -> propertyService.toResponse(p))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/properties/search
     * Recherche immobilière sur l'API externe (RapidAPI ou Mock Maroc de secours).
     */
    @GetMapping("/search")
    public ResponseEntity<PropertyDto.SearchResponse> search(
            @RequestParam(value = "dealId", required = false) UUID dealId,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "propertyType", required = false) String propertyType,
            @RequestParam(value = "minPrice", required = false) Double minPrice,
            @RequestParam(value = "maxPrice", required = false) Double maxPrice,
            @RequestParam(value = "minRooms", required = false) Integer minRooms,
            @RequestParam(value = "maxRooms", required = false) Integer maxRooms,
            @RequestParam(value = "floor", required = false) Integer floor,
            @RequestParam(value = "page", defaultValue = "1") int page) {

        return ResponseEntity.ok(propertyService.search(dealId, city, propertyType, minPrice, maxPrice, minRooms, maxRooms, floor, page));
    }

    /**
     * POST /api/properties/link?dealId={dealId}
     * Lie un bien immobilier à un dossier client (crée le bien en base locale).
     */
    @PostMapping("/link")
    public ResponseEntity<PropertyDto.Response> linkProperty(
            @RequestParam("dealId") UUID dealId,
            @RequestBody PropertyDto.LinkRequest request) {
        
        PropertyDto.Response response = propertyService.linkPropertyToDeal(dealId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/properties/deal/{dealId}
     * Récupère la liste des biens immobiliers associés ou proposés pour ce dossier.
     */
    @GetMapping("/deal/{dealId}")
    public ResponseEntity<List<PropertyDto.Response>> getPropertiesByDeal(@PathVariable("dealId") UUID dealId) {
        List<PropertyDto.Response> response = propertyService.getPropertiesByDeal(dealId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/properties/recommend?dealId={dealId}
     * Récupère les 3 meilleures recommandations IA pour un dossier acheteur.
     */
    @GetMapping("/recommend")
    public ResponseEntity<List<com.smartestatehub.ai.dto.PropertyRecommendationResult>> recommendProperties(
            @RequestParam("dealId") UUID dealId) {
        return ResponseEntity.ok(propertyRecommendationService.getRecommendations(dealId));
    }
}
