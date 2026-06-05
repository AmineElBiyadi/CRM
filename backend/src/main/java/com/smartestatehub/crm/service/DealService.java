package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.ContractDto;
import com.smartestatehub.crm.dto.CreateDossierRequest;
import com.smartestatehub.crm.dto.DossierDetailDto;
import com.smartestatehub.crm.dto.DossierSummaryDto;
import com.smartestatehub.crm.dto.UpdateDossierRequest;
import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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
    private final ContractRepository contractRepository;
    private final DealStageUpdateRepository dealStageUpdateRepository;
    private final DealAssignmentRepository dealAssignmentRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final PropertyRepository propertyRepository;

    @Transactional(readOnly = true)
    public List<ColdLeadDto> getColdLeads() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(10);
        List<DealStage> terminalStages = List.of(DealStage.CLOSED, DealStage.LOST);
        
        return dealRepository.findColdLeads(threshold, terminalStages).stream()
                .map(d -> {
                    var client = d.getClientFolder().getClient();
                    var agent = d.getClientFolder().getAssignedAgent();
                    long days = d.getLastInteractionAt() == null 
                            ? ChronoUnit.DAYS.between(d.getCreatedAt(), LocalDateTime.now())
                            : ChronoUnit.DAYS.between(d.getLastInteractionAt(), LocalDateTime.now());
                    
                    return new ColdLeadDto(
                            client.getFirstName() + " " + client.getLastName(),
                            client.getEmail(),
                            agent != null ? agent.getEmail() : "Non assigné",
                            agent != null ? agent.getIdUser() : null,
                            d.getClientFolder().getIdProfile(),
                            days
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void closeDeal(UUID dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Dossier (Deal) introuvable."));
        deal.setStage(DealStage.CLOSED);
        dealRepository.save(deal);
    }

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
                .aiLeadScore(0)
                .aiRecommendedAction("En attente de la première interaction pour analyse.")
                .aiSummary("Nouveau dossier créé. En attente d'interactions.")
                .isUrgent(false)
                .build();
        
        deal = dealRepository.save(deal);

        // Journaliser le premier stage
        dealStageUpdateRepository.save(DealStageUpdate.builder()
                .deal(deal)
                .fromStage(null)
                .toStage(DealStage.COLD)
                .user(agent)
                .build());

        // Journaliser la première affectation
        dealAssignmentRepository.save(DealAssignment.builder()
                .deal(deal)
                .user(agent)
                .assignedAt(java.time.LocalDateTime.now())
                .reason("Création du dossier")
                .build());

        return mapToSummaryDto(deal);
    }

    @Transactional(readOnly = true)
    public DossierDetailDto getDossierDetail(UUID id) {
        System.out.println("Fetching dossier/folder detail for ID: " + id);
        Optional<Deal> dealOpt = dealRepository.findById(id);
        
        if (dealOpt.isPresent()) {
            System.out.println("Found as Deal ID");
            Deal deal = dealOpt.get();
            ClientFolder folder = deal.getClientFolder();
            return mapToDetailDto(deal, folder);
        }

        // Fallback: Check if it's a ClientFolder ID (for pending dossiers)
        System.out.println("Not found as Deal. Trying ClientFolder...");
        ClientFolder folder = clientFolderRepository.findById(id)
                .orElseThrow(() -> {
                    System.err.println("CRITICAL: ID " + id + " not found in either Deal or ClientFolder tables.");
                    return new RuntimeException("Dossier/Folder not found: " + id);
                });
        
        System.out.println("Found as ClientFolder ID");
        // Check if the folder has an active deal — use it to get the correct stage
        Optional<Deal> activeDeal = folder.getDeals() == null ? Optional.empty() :
                folder.getDeals().stream()
                        .filter(d -> d.getDeletedAt() == null)
                        .findFirst();
        return mapToDetailDto(activeDeal.orElse(null), folder);
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
                .assignedAgentId(agent != null ? agent.getIdUser() : null)
                .assignedAgentName(agentName)
                .assignmentHistory(mapAssignmentsToDto(deal));

        if (deal != null) {
            builder.stage(deal.getStage())
                    .aiLeadScore(deal.getAiLeadScore())
                    .aiScoreExplanation(deal.getAiScoreExplanation())
                    .aiRecommendedAction(deal.getAiRecommendedAction())
                    .aiSummary(deal.getAiSummary())
                    .aiStageSuggestion(deal.getAiStageSuggestion())
                    .aiStageSuggestionReason(deal.getAiStageSuggestionReason())
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
                    .preferredSizeM2(buyer.getPreferredSizeM2())
                    .preferredFloor(buyer.getPreferredFloor())
                    .preferredArea(buyer.getPreferredArea())
                    .propertyType(buyer.getPropertyType() != null ? buyer.getPropertyType().getSpecificType() : null);
        } else if (folder.getClientType() == ClientType.SELLER && folder.getSellerFolder() != null) {
            SellerFolder seller = folder.getSellerFolder();
            if (seller.getProperties() != null && !seller.getProperties().isEmpty()) {
                Property prop = seller.getProperties().get(0);
                builder.propertyTitle(prop.getTitle())
                        .address(prop.getAddress())
                        .city(prop.getCity())
                        .askingPrice(prop.getPrice())
                        .propertySurfaceM2(prop.getSurfaceM2())
                        .numRooms(prop.getNumRooms())
                        .propertyFloor(prop.getFloor())
                        .propertyType(prop.getPropertyType() != null ? prop.getPropertyType().getSpecificType() : null);
                
                if (prop.getImages() != null) {
                    builder.propertyImageUrls(prop.getImages().stream()
                            .map(PropertyImage::getImageUrl)
                            .collect(java.util.stream.Collectors.toList()));
                }
            }
        }

        if (deal != null && deal.getDocuments() != null) {
            builder.documents(deal.getDocuments().stream()
                    .filter(doc -> doc.getDeletedAt() == null)
                    .map(this::mapToDocumentDto)
                    .collect(java.util.stream.Collectors.toList()));
        }

        if (deal != null) {
            List<Contract> contracts = contractRepository.findByDealIdActive(deal.getIdDeal());
            builder.contracts(contracts.stream()
                    .map(this::mapToContractDto)
                    .collect(java.util.stream.Collectors.toList()));
        }

        return builder.build();
    }

    private ContractDto.Response mapToContractDto(Contract c) {
        return ContractDto.Response.builder()
                .idContract(c.getIdContract())
                .agreedPrice(c.getAgreedPrice())
                .depositAmount(c.getDepositAmount())
                .status(c.getStatus())
                .sentAt(c.getSentAt())
                .signedAt(c.getSignedAt())
                .aiRiskSummary(c.getAiRiskSummary())
                .createdAt(c.getCreatedAt())
                .pdfUrl(c.getPdfUrl())
                .build();
    }

    private com.smartestatehub.crm.dto.DocumentDto mapToDocumentDto(Document d) {
        return com.smartestatehub.crm.dto.DocumentDto.builder()
                .idDocument(d.getIdDocument())
                .documentType(d.getDocumentType().name())
                .filePath(d.getFilePath())
                .confirmedReceived(d.isConfirmedReceived())
                .createdAt(d.getCreatedAt())
                .dealId(d.getDeal().getIdDeal())
                .build();
    }

    private List<AssignmentHistoryDto> mapAssignmentsToDto(Deal deal) {
        if (deal == null || deal.getAssignments() == null) return List.of();
        return deal.getAssignments().stream()
                .<AssignmentHistoryDto>map(a -> AssignmentHistoryDto.builder()
                        .idAssignment(a.getIdDealAssignment())
                        .agentId(a.getUser().getIdUser())
                        .agentName(a.getUser().getFirstName() + " " + a.getUser().getLastName())
                        .assignedAt(a.getAssignedAt())
                        .unassignedAt(a.getUnassignedAt())
                        .reason(a.getReason())
                        .build())
                .sorted((a, b) -> b.getAssignedAt().compareTo(a.getAssignedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public DossierDetailDto updateDossier(UUID id, UpdateDossierRequest request) {
        Optional<Deal> dealOpt = dealRepository.findById(id);
        ClientFolder folder;
        Deal deal = null;

        if (dealOpt.isPresent()) {
            deal = dealOpt.get();
            folder = deal.getClientFolder();
        } else {
            folder = clientFolderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Dossier/Folder not found: " + id));
            // Look for active deal in folder
            deal = folder.getDeals() == null ? null : folder.getDeals().stream()
                    .filter(d -> d.getDeletedAt() == null)
                    .findFirst()
                    .orElse(null);
        }

        // Update Folder Type if changed
        if (request.getType() != null) {
            folder.setClientType(request.getType());
        }

        if (folder.getClientType() == ClientType.BUYER) {
            BuyerFolder buyer = folder.getBuyerFolder();
            if (buyer == null) {
                buyer = BuyerFolder.builder().clientFolder(folder).idProfile(folder.getIdProfile()).build();
                folder.setBuyerFolder(buyer);
            }
            if (request.getBudgetMin() != null) buyer.setBudgetMin(request.getBudgetMin());
            if (request.getBudgetMax() != null) buyer.setBudgetMax(request.getBudgetMax());
            if (request.getPreferredSizeM2() != null) buyer.setPreferredSizeM2(request.getPreferredSizeM2());
            if (request.getPreferredArea() != null) buyer.setPreferredArea(request.getPreferredArea());
            if (request.getPreferredFloor() != null) buyer.setPreferredFloor(request.getPreferredFloor());

            if (request.getPropertySpecificType() != null) {
                PropertyType pType = propertyTypeRepository.findAll().stream()
                        .filter(pt -> pt.getSpecificType().equalsIgnoreCase(request.getPropertySpecificType()))
                        .findFirst()
                        .orElse(null);
                buyer.setPropertyType(pType);
            }
        } else {
            SellerFolder seller = folder.getSellerFolder();
            if (seller == null) {
                seller = SellerFolder.builder().clientFolder(folder).idProfile(folder.getIdProfile()).build();
                folder.setSellerFolder(seller);
            }

            Property property;
            if (seller.getProperties() == null || seller.getProperties().isEmpty()) {
                property = Property.builder().sellerFolder(seller).isAvailable(true).build();
                seller.setProperties(new java.util.ArrayList<>(java.util.List.of(property)));
            } else {
                property = seller.getProperties().get(0);
            }

            if (request.getPropertyTitle() != null) property.setTitle(request.getPropertyTitle());
            if (request.getAddress() != null) property.setAddress(request.getAddress());
            if (request.getCity() != null) property.setCity(request.getCity());
            if (request.getAskingPrice() != null) property.setPrice(request.getAskingPrice());
            if (request.getPropertySurfaceM2() != null) property.setSurfaceM2(request.getPropertySurfaceM2());
            if (request.getNumRooms() != null) property.setNumRooms(request.getNumRooms());
            if (request.getPropertyFloor() != null) property.setFloor(request.getPropertyFloor());

            if (request.getPropertySpecificType() != null) {
                PropertyType pType = propertyTypeRepository.findAll().stream()
                        .filter(pt -> pt.getSpecificType().equalsIgnoreCase(request.getPropertySpecificType()))
                        .findFirst()
                        .orElse(null);
                property.setPropertyType(pType);
            }

            // Update images if provided
            if (request.getPropertyImageUrls() != null) {
                // Remove old images
                if (property.getImages() != null) {
                    propertyImageRepository.deleteAll(property.getImages());
                    property.getImages().clear();
                } else {
                    property.setImages(new java.util.ArrayList<>());
                }

                // Add new images
                int order = 1;
                for (String url : request.getPropertyImageUrls()) {
                    PropertyImage img = PropertyImage.builder()
                            .imageUrl(url)
                            .displayOrder(order++)
                            .property(property)
                            .build();
                    property.getImages().add(img);
                }
                propertyRepository.save(property);
            }
        }

        // Handle Agent Reassignment
        if (request.getAssignedAgentId() != null) {
            InternalUser currentAgent = folder.getAssignedAgent();
            if (currentAgent == null || !currentAgent.getIdUser().equals(request.getAssignedAgentId())) {
                InternalUser newAgent = userRepository.findById(request.getAssignedAgentId())
                        .orElseThrow(() -> new RuntimeException("New agent not found: " + request.getAssignedAgentId()));
                
                // 1. Close current assignment if exists
                if (deal != null && deal.getAssignments() != null) {
                    deal.getAssignments().stream()
                            .filter(a -> a.getUnassignedAt() == null)
                            .forEach(a -> {
                                a.setUnassignedAt(LocalDateTime.now());
                                dealAssignmentRepository.save(a);
                            });
                }

                // 2. Create new assignment
                if (deal != null) {
                    String reason = request.getReassignReason() != null ? request.getReassignReason() : "Réaffectation par l'administrateur";
                    DealAssignment newAssignment = DealAssignment.builder()
                            .deal(deal)
                            .user(newAgent)
                            .reason(reason)
                            .build();
                    dealAssignmentRepository.save(newAssignment);
                }

                // 3. Update folder
                folder.setAssignedAgent(newAgent);
            }
        }

        clientFolderRepository.save(folder);
        return getDossierDetail(id);
    }

    @Transactional
    public DossierDetailDto updateDealStage(UUID dealId, DealStage newStage, UUID userId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Dossier not found: " + dealId));
        
        InternalUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        DealStage oldStage = deal.getStage();
        deal.setStage(newStage);
        deal = dealRepository.save(deal);

        // Journaliser le changement de stage
        dealStageUpdateRepository.save(DealStageUpdate.builder()
                .deal(deal)
                .fromStage(oldStage)
                .toStage(newStage)
                .user(user)
                .build());

        return getDossierDetail(deal.getIdDeal());
    }

    
    @Transactional
    public DossierDetailDto dismissSuggestion(UUID dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new RuntimeException("Dossier not found: " + dealId));
        
        deal.setAiStageSuggestion(null);
        deal.setAiStageSuggestionReason(null);
        dealRepository.save(deal);
        
        return getDossierDetail(dealId);
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
        dto.setNewDossier(deal.getClientFolder().getStatus() == FolderStatus.PENDING);
        dto.setCreatedAt(deal.getCreatedAt());
        
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
        dto.setNewDossier(folder.getStatus() == FolderStatus.PENDING);
        dto.setAiRecommendedAction("Nouveau dossier à qualifier.");
        dto.setLastInteractionAt(folder.getCreatedAt());
        dto.setCreatedAt(folder.getCreatedAt());
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
                false, // newDossier handled in caller
                null,  // Time handled in caller
                null,   // Action handled in caller
                folder.getCreatedAt()
        );
    }
}
