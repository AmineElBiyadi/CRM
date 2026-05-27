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
        List<Deal> deals = dealRepository.findActiveDossiersByAgentId(agentId);
        
        return deals.stream()
                .map(this::mapToSummaryDto)
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
            SellerFolder sellerProfile = SellerFolder.builder()
                    .clientFolder(folder)
                    .build();
            folder.setSellerFolder(sellerProfile);
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
    public DossierDetailDto getDossierDetail(UUID dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Dossier not found: " + dealId));
        
        ClientFolder folder = deal.getClientFolder();
        Client client = folder.getClient();
        InternalUser agent = folder.getAssignedAgent();

        String agentName = (agent != null) ? agent.getFirstName() + " " + agent.getLastName() : "Non assigné";

        DossierDetailDto.DossierDetailDtoBuilder builder = DossierDetailDto.builder()
                .idDeal(deal.getIdDeal())
                .idClient(client.getIdClient())
                .clientName(client.getFirstName() + " " + client.getLastName())
                .clientEmail(client.getEmail())
                .clientPhone(client.getPhone())
                .clientSource(client.getSource())
                .clientType(folder.getClientType())
                .stage(deal.getStage())
                .aiLeadScore(deal.getAiLeadScore())
                .aiScoreExplanation(deal.getAiScoreExplanation())
                .aiRecommendedAction(deal.getAiRecommendedAction())
                .aiSummary(deal.getAiSummary())
                .isUrgent(deal.getIsUrgent())
                .assignedAgentName(agentName)
                .lastInteractionAt(deal.getLastInteractionAt());

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
        String clientName = "Inconnu";
        ClientType type = ClientType.BUYER;
        
        if (deal.getClientFolder() != null) {
            type = deal.getClientFolder().getClientType();
            if (deal.getClientFolder().getClient() != null) {
                clientName = deal.getClientFolder().getClient().getFirstName() + " " + deal.getClientFolder().getClient().getLastName();
            }
        }

        return new DossierSummaryDto(
                deal.getIdDeal(),
                clientName,
                type,
                deal.getStage(),
                deal.getAiLeadScore(),
                deal.getIsUrgent(),
                deal.getLastInteractionAt(),
                deal.getAiRecommendedAction()
        );
    }
}
