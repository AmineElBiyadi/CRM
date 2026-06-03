package com.smartestatehub.crm.service;

import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Offer;
import com.smartestatehub.crm.model.OfferStatus;
import com.smartestatehub.crm.model.Property;
import com.smartestatehub.crm.model.PropertyUnavailableReason;
import com.smartestatehub.crm.repository.OfferRepository;
import com.smartestatehub.crm.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OfferService {

    private final OfferRepository offerRepository;
    private final PropertyRepository propertyRepository;

    /**
     * Accepte une offre, marque la propriété comme vendue, 
     * et rejette les autres offres du même deal, 
     * rendant leurs propriétés de nouveau disponibles.
     */
    @Transactional
    public void acceptOffer(UUID offerId) {
        log.info("Acceptation de l'offre ID: {}", offerId);
        Offer acceptedOffer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offre introuvable: " + offerId));

        Deal deal = acceptedOffer.getDeal();
        
        // Mettre l'offre à ACCEPTED et sa propriété à SOLD
        acceptedOffer.setStatus(OfferStatus.ACCEPTED);
        Property acceptedProp = acceptedOffer.getProperty();
        acceptedProp.setAvailable(false);
        acceptedProp.setUnavailableReason(PropertyUnavailableReason.SOLD);
        acceptedProp.setUnavailableAt(LocalDateTime.now());
        
        propertyRepository.save(acceptedProp);
        offerRepository.save(acceptedOffer);

        // Trouver toutes les autres offres du Deal et les REJETER, puis libérer leurs propriétés
        List<Offer> otherOffers = offerRepository.findByDeal_IdDeal(deal.getIdDeal());
        for (Offer offer : otherOffers) {
            if (!offer.getIdOffer().equals(offerId) && offer.getStatus() == OfferStatus.PENDING) {
                offer.setStatus(OfferStatus.REJECTED);
                offerRepository.save(offer);

                Property releasedProp = offer.getProperty();
                // Si la propriété n'est pas déjà vendue ailleurs
                if (releasedProp.getUnavailableReason() != PropertyUnavailableReason.SOLD) {
                    releasedProp.setAvailable(true);
                    releasedProp.setUnavailableReason(null);
                    releasedProp.setUnavailableAt(null);
                    propertyRepository.save(releasedProp);
                    
                    log.info("L'offre {} a été rejetée car une autre offre a été acceptée. La propriété {} est de nouveau disponible.", 
                            offer.getIdOffer(), releasedProp.getIdProperty());
                }
            }
        }
    }
}
