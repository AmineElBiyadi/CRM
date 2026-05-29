package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.service.OfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowedHeaders = "*", allowCredentials = "true")
public class OfferController {

    private final OfferService offerService;

    /**
     * POST /api/offers/{offerId}/accept
     * Accepte l'offre spécifiée, marque le bien comme vendu,
     * et rend disponibles les autres biens en attente pour ce dossier.
     */
    @PostMapping("/{offerId}/accept")
    public ResponseEntity<Void> acceptOffer(@PathVariable("offerId") UUID offerId) {
        offerService.acceptOffer(offerId);
        return ResponseEntity.ok().build();
    }
}
