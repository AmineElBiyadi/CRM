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
import org.springframework.util.StringUtils;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

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
        String localUrl = null;
        if (doc.getLocalFilePath() != null) {
            // Transforme le chemin relatif en URL accessible via /uploads/
            localUrl = "/uploads/" + doc.getLocalFilePath().replace("\\", "/");
        }

        return DocumentDto.builder()
                .idDocument(doc.getIdDocument())
                .documentType(doc.getDocumentType() != null ? doc.getDocumentType().name() : null)
                .filePath(doc.getFilePath())
                .localFilePath(localUrl)
                .confirmedReceived(doc.isConfirmedReceived())
                .createdAt(doc.getCreatedAt())
                .dealId(doc.getDeal() != null ? doc.getDeal().getIdDeal() : null)
                .build();
    }

    @Transactional
    public DocumentDto saveDocumentInfo(UUID dealId, String cloudinaryUrl, DocumentType type) {
        log.info("Enregistrement des infos du document pour le deal ID: {}, type: {}", dealId, type);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier (Deal) non trouvé avec l'ID: " + dealId));

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
    public DocumentDto uploadDocument(UUID dealId, DocumentType type, MultipartFile file) throws IOException {
        log.info("Traitement de l'upload local + Cloudinary pour le deal: {}, type: {}", dealId, type);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier non trouvé: " + dealId));

        // 1. Sauvegarde locale
        String relativeDir = "documents";
        String uploadDir = "uploads/" + relativeDir;
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String filename = type.name() + "_" + UUID.randomUUID() + "_" + originalFilename;
        Path targetLocation = Paths.get(uploadDir).resolve(filename);
        
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        // On stocke le chemin relatif par rapport à /uploads/
        String localPath = relativeDir + "/" + filename;
        log.info("Fichier sauvegardé localement: {}", localPath);

        // 2. Upload Cloudinary
        String cloudinaryUrl = null;
        try {
            byte[] bytes = file.getBytes();
            // On réutilise la logique Cloudinary existante (image/upload pour les PDF)
            String clientName = deal.getClientFolder().getClient().getFirstName() + "_" + deal.getClientFolder().getClient().getLastName();
            String publicId = type.name() + "_" + clientName.replace(" ", "_") + "_" + System.currentTimeMillis();
            cloudinaryUrl = cloudinaryService.upload(bytes, publicId, "documents", "image");
        } catch (Exception e) {
            log.error("Échec upload Cloudinary (on continue avec le local): {}", e.getMessage());
        }

        // 3. Persistance DB
        List<Document> existing = documentRepository.findByDeal_IdDeal(dealId);
        Document doc = existing.stream()
                .filter(d -> d.getDocumentType() == type && d.getFilePath() == null)
                .findFirst()
                .orElse(null);

        if (doc != null) {
            if (cloudinaryUrl != null) doc.setFilePath(cloudinaryUrl);
            doc.setLocalFilePath(localPath);
            doc.setConfirmedReceived(true);
        } else {
            doc = Document.builder()
                    .deal(deal)
                    .documentType(type)
                    .filePath(cloudinaryUrl)
                    .localFilePath(localPath)
                    .confirmedReceived(true)
                    .isEmbedded(false)
                    .build();
        }

        Document savedDoc = documentRepository.save(doc);
        
        // 4. Notification RAG
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