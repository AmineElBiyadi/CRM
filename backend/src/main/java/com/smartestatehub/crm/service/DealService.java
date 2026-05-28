package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.CreateDossierRequest;
import com.smartestatehub.crm.dto.DossierDetailDto;
import com.smartestatehub.crm.dto.DossierSummaryDto;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ClientFolderRepository clientFolderRepository;
    private final PropertyTypeRepository propertyTypeRepository;


    @Transactional(readOnly = true)
    public List<DossierSummaryDto> getDossierListingForAgent(UUID agentId) {
        // Fetch all folders assigned to this agent
        List<ClientFolder> folders = clientFolderRepository.findByAssignedAgent_IdUserAndDeletedAtIsNull(agentId);
        
        return folders.stream()
                .map(this::mapFolderToSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DossierSummaryDto createDossier(CreateDossierRequest request, UUID agentId) {
        Client client = clientRepository.findById(request.getIdClient())
                .orElseThrow(() -> new RuntimeException("Client identity not found: " + request.getIdClient()));
        
        InternalUser agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        // 1. Create ClientFolder
        ClientFolder folder = ClientFolder.builder()
                .client(client)
                .assignedAgent(agent)
                .createdByAgent(agent)
                .clientType(request.getType())
                .status(FolderStatus.ACTIVE)
                .build();
        
        // 2. Create specific profile (Buyer/Seller)
        if (request.getType() == ClientType.BUYER) {
            PropertyType pType = null;
            if (request.getPropertySpecificType() != null) {
                pType = propertyTypeRepository.findAll().stream()
                        .filter(pt -> pt.getSpecificType().equalsIgnoreCase(request.getPropertySpecificType()))
                        .findFirst()
                        .orElse(null);
            }

            BuyerFolder buyerProfile = BuyerFolder.builder()
                    .clientFolder(folder)
                    .budgetMin(request.getBudgetMin())
                    .budgetMax(request.getBudgetMax())
                    .preferredSizeM2(request.getSurfaceM2())
                    .preferredArea(request.getPreferredArea())
                    .preferredFloor(request.getFloor() != null ? request.getFloor() : -1)
                    .propertyType(pType)
                    .build();
            folder.setBuyerFolder(buyerProfile);
        } else {
            // Resolve property type for seller's property
            PropertyType sellerPType = null;
            if (request.getPropertySpecificType() != null) {
                sellerPType = propertyTypeRepository.findAll().stream()
                        .filter(pt -> pt.getSpecificType().equalsIgnoreCase(request.getPropertySpecificType()))
                        .findFirst()
                        .orElse(null);
            }
            
            // Safety: if pType is still null (e.g. no match or null request), find first available or create dummy
            if (sellerPType == null) {
                sellerPType = propertyTypeRepository.findAll().stream().findFirst().orElseGet(() -> 
                   propertyTypeRepository.save(PropertyType.builder()
                        .generalType("IMMOBILIER")
                        .specificType("NON_SPECIFIE")
                        .description("Type par défaut")
                        .build())
                );
            }

            SellerFolder sellerProfile = SellerFolder.builder()
                    .clientFolder(folder)
                    .build();
            folder.setSellerFolder(sellerProfile);

            // Auto-create the Property linked to the SellerFolder if property details provided
            if (request.getPropertyTitle() != null && !request.getPropertyTitle().isBlank()) {
                Property property = Property.builder()
                        .title(request.getPropertyTitle())
                        .address(request.getAddress())
                        .city(request.getCity())
                        .price(request.getAskingPrice())
                        .surfaceM2(request.getPropertySurfaceM2())
                        .numRooms(request.getNumRooms())
                        .floor(request.getPropertyFloor())
                        .propertyType(sellerPType)
                        .sellerFolder(sellerProfile)
                        .isAvailable(true)
                        .build();

                // Attach images if provided
                if (request.getPropertyImageUrls() != null && !request.getPropertyImageUrls().isEmpty()) {
                    java.util.List<PropertyImage> images = new java.util.ArrayList<>();
                    int order = 1;
                    for (String url : request.getPropertyImageUrls()) {
                        images.add(PropertyImage.builder()
                                .imageUrl(url)
                                .displayOrder(order++)
                                .property(property)
                                .build());
                    }
                    property.setImages(images);
                }

                sellerProfile.setProperties(new java.util.ArrayList<>(java.util.List.of(property)));
            }
        }

        folder = clientFolderRepository.save(folder);

        // 3. Create Deal
        Deal deal = Deal.builder()
                .clientFolder(folder)
                .stage(DealStage.COLD)
                .aiLeadScore((int) (Math.random() * 20) + 50) // Mock initial score 50-70
                .aiRecommendedAction("Analyser les besoins et proposer une première sélection.")
                .aiSummary("Nouveau dossier " + request.getType() + " créé.")
                .isUrgent(false)
                .build();
        
        deal = dealRepository.save(deal);

        return mapToSummaryDto(deal);
    }

    @Transactional(readOnly = true)
    public DossierDetailDto getDossierDetail(UUID id) {
        Optional<Deal> dealOpt = dealRepository.findById(id);
        
        if (dealOpt.isPresent()) {
            Deal deal = dealOpt.get();
            ClientFolder folder = deal.getClientFolder();
            return mapToDetailDto(deal, folder);
        }

        // Fallback: Check if it's a ClientFolder ID (for pending dossiers)
        ClientFolder folder = clientFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier/Folder not found: " + id));
        
        return mapToDetailDto(null, folder);
    }

    private DossierDetailDto mapToDetailDto(Deal deal, ClientFolder folder) {
        Client client = folder.getClient();
        InternalUser agent = folder.getAssignedAgent();
        String agentName = (agent != null) ? agent.getFirstName() + " " + agent.getLastName() : "Non assigné";

        DossierDetailDto.DossierDetailDtoBuilder builder = DossierDetailDto.builder()
                .idDeal(deal != null ? deal.getIdDeal() : null)
                .idProfile(folder.getIdProfile())
                .idClient(client.getIdClient())
                .clientName(client.getFirstName() + " " + client.getLastName())
                .clientEmail(client.getEmail())
                .clientPhone(client.getPhone())
                .clientSource(client.getSource())
                .clientType(folder.getClientType())
                .assignedAgentName(agentName);

        if (deal != null) {
            builder.stage(deal.getStage())
                    .aiLeadScore(deal.getAiLeadScore())
                    .aiScoreExplanation(deal.getAiScoreExplanation())
                    .aiRecommendedAction(deal.getAiRecommendedAction())
                    .aiSummary(deal.getAiSummary())
                    .isUrgent(deal.getIsUrgent())
                    .lastInteractionAt(deal.getLastInteractionAt());
        } else {
            builder.stage(DealStage.COLD)
                    .aiLeadScore(0)
                    .aiRecommendedAction("Nouveau dossier à qualifier.")
                    .isUrgent(false)
                    .lastInteractionAt(folder.getCreatedAt());
        }

        if (folder.getClientType() == ClientType.BUYER && folder.getBuyerFolder() != null) {
            BuyerFolder buyer = folder.getBuyerFolder();
            builder.budgetMin(buyer.getBudgetMin())
                    .budgetMax(buyer.getBudgetMax())
                    .preferredArea(buyer.getPreferredArea())
                    .preferredSizeM2(buyer.getPreferredSizeM2())
                    .preferredFloor(buyer.getPreferredFloor())
                    .propertyType(buyer.getPropertyType() != null ? buyer.getPropertyType().getSpecificType() : null);
        }

        return builder.build();
    }

    @Transactional
    public DossierDetailDto updateDealStage(UUID dealId, DealStage newStage) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Dossier not found: " + dealId));
        
        deal.setStage(newStage);
        deal = dealRepository.save(deal);
        
        return getDossierDetail(deal.getIdDeal());
    }

    private DossierSummaryDto mapToSummaryDto(Deal deal) {
        // Start with base folder info
        DossierSummaryDto dto = mapFolderToBaseSummaryDto(deal.getClientFolder());
        
        // Add deal-specific info
        dto.setIdDeal(deal.getIdDeal());
        dto.setStage(deal.getStage());
        dto.setAiLeadScore(deal.getAiLeadScore());
        dto.setIsUrgent(deal.getIsUrgent());
        dto.setLastInteractionAt(deal.getLastInteractionAt());
        dto.setAiRecommendedAction(deal.getAiRecommendedAction());
        dto.setIsNew(false);
        
        return dto;
    }

    private DossierSummaryDto mapFolderToSummaryDto(ClientFolder folder) {
        // If folder has deals, map the primary deal
        if (folder.getDeals() != null && !folder.getDeals().isEmpty()) {
            Optional<Deal> activeDeal = folder.getDeals().stream()
                    .filter(d -> d.getDeletedAt() == null)
                    .findFirst();
            if (activeDeal.isPresent()) {
                return mapToSummaryDto(activeDeal.get());
            }
        }

        // Otherwise return a "deal-less" summary
        DossierSummaryDto dto = mapFolderToBaseSummaryDto(folder);
        dto.setIsNew(folder.getStatus() == FolderStatus.PENDING);
        dto.setAiRecommendedAction("Nouveau dossier à qualifier.");
        dto.setLastInteractionAt(folder.getCreatedAt());
        return dto;
    }

    private DossierSummaryDto mapFolderToBaseSummaryDto(ClientFolder folder) {
        String clientName = "Inconnu";
        if (folder.getClient() != null) {
            clientName = folder.getClient().getFirstName() + " " + folder.getClient().getLastName();
        }

        return new DossierSummaryDto(
                null,
                folder.getIdProfile(),
                clientName,
                folder.getClientType(),
                DealStage.COLD,
                null,
                false,
                false, // isNew handled in caller
                null,  // Time handled in caller
                null   // Action handled in caller
        );
    }
}
