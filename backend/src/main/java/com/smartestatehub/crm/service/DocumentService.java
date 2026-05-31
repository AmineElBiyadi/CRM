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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DealRepository dealRepository;
    private final CloudinaryService cloudinaryService;


    private DocumentDto toDto(Document doc) {
        return DocumentDto.builder()
                .idDocument(doc.getIdDocument())
                .documentType(doc.getDocumentType() != null ? doc.getDocumentType().name() : null)
                .filePath(doc.getFilePath())
                .confirmedReceived(doc.getConfirmedReceived())
                .createdAt(doc.getCreatedAt())
                .dealId(doc.getDeal() != null ? doc.getDeal().getIdDeal() : null)
                .build();
    }

    @Transactional
    public DocumentDto uploadDocument(UUID dealId, MultipartFile file, DocumentType type) throws IOException {
        log.info("Upload de document pour le deal ID: {}, type: {}", dealId, type);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier (Deal) non trouvé avec l'ID: " + dealId));

        // Nom unique
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String publicId = java.util.UUID.randomUUID() + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");

        // Upload sur Cloudinary
        String cloudinaryUrl = cloudinaryService.upload(file.getBytes(), publicId, "documents", "raw");

        Document doc = Document.builder()
                .deal(deal)
                .documentType(type)
                .filePath(cloudinaryUrl)   // URL Cloudinary publique
                .confirmedReceived(true)
                .isEmbedded(false)
                .build();

        return toDto(documentRepository.save(doc));
    }

    public List<DocumentDto> getDocumentsByDeal(UUID dealId) {
        return documentRepository.findByDeal_IdDeal(dealId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}