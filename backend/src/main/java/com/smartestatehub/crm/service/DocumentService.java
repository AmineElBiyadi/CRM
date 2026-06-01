package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.DocumentDto;
import com.smartestatehub.crm.model.Document;
import com.smartestatehub.crm.model.DocumentType;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.repository.DocumentRepository;
import com.smartestatehub.crm.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.smartestatehub.crm.event.DocumentUploadedEvent;
import org.springframework.context.ApplicationEventPublisher;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DealRepository dealRepository;
    private final CloudinaryService cloudinaryService;
    private final ApplicationEventPublisher eventPublisher;


    private DocumentDto toDto(Document doc) {
        return DocumentDto.builder()
                .idDocument(doc.getIdDocument())
                .documentType(doc.getDocumentType() != null ? doc.getDocumentType().name() : null)
                .filePath(doc.getFilePath())
                .confirmedReceived(doc.isConfirmedReceived())
                .createdAt(doc.getCreatedAt())
                .dealId(doc.getDeal() != null ? doc.getDeal().getIdDeal() : null)
                .build();
    }

    @Transactional
    public DocumentDto uploadDocument(UUID dealId, MultipartFile file, DocumentType type) throws IOException {
        log.info("Upload de document pour le deal ID: {}, type: {}", dealId, type);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier (Deal) non trouvé avec l'ID: " + dealId));

        // Nom généré : Type_FirstName_LastName
        String clientName = deal.getClientFolder().getClient().getFirstName() + "_" + deal.getClientFolder().getClient().getLastName();
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String generatedName = type.name() + "_" + clientName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String publicId = java.util.UUID.randomUUID() + "_" + generatedName + extension;

        // Upload sur Cloudinary en forçant le type RAW pour les PDFs
        // Cela garantit que Cloudinary ne tente pas de les traiter comme des images, ce qui cause les erreurs 401
        String cloudinaryUrl = cloudinaryService.upload(file.getBytes(), publicId, "documents", "raw");

        // Vérifier si un placeholder existe déjà pour ce deal et ce type sans chemin de fichier
        List<Document> existing = documentRepository.findByDeal_IdDeal(dealId);
        Document doc = existing.stream()
                .filter(d -> d.getDocumentType() == type && d.getFilePath() == null)
                .findFirst()
                .orElse(null);

        if (doc != null) {
            doc.setFilePath(cloudinaryUrl);
            doc.setConfirmedReceived(true);
        } else {
            doc = Document.builder()
                    .deal(deal)
                    .documentType(type)
                    .filePath(cloudinaryUrl)
                    .confirmedReceived(true)
                    .isEmbedded(false)
                    .build();
        }

        Document savedDoc = documentRepository.save(doc);
        
        // Publier l'événement pour déclencher le RAG en arrière-plan
        eventPublisher.publishEvent(new DocumentUploadedEvent(this, savedDoc));

        return toDto(savedDoc);
    }

    @Transactional
    public DocumentDto requestDocument(UUID dealId, DocumentType type) {
        log.info("Demande de document (placeholder) pour le deal ID: {}, type: {}", dealId, type);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier (Deal) non trouvé avec l'ID: " + dealId));

        Document doc = Document.builder()
                .deal(deal)
                .documentType(type)
                .filePath(null)
                .confirmedReceived(false)
                .isEmbedded(false)
                .build();

        return toDto(documentRepository.save(doc));
    }

    public List<DocumentDto> getDocumentsByDeal(UUID dealId) {
        log.info("Récupération des documents pour le deal ID: {}", dealId);
        return documentRepository.findByDeal_IdDealAndDeletedAtIsNull(dealId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(UUID documentId) {
        log.info("Suppression logique du document ID: {}", documentId);
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document non trouvé avec l'ID: " + documentId));
        doc.setDeletedAt(LocalDateTime.now());
        documentRepository.save(doc);
    }
}