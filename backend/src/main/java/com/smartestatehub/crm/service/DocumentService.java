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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    private final String uploadDir = "uploads/documents/";

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

        // Créer le dossier si inexistant
        Path root = Paths.get(uploadDir);
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        // Nom de fichier unique
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path targetPath = root.resolve(fileName);
        Files.copy(file.getInputStream(), targetPath);

        Document doc = Document.builder()
                .deal(deal)
                .documentType(type)
                .filePath(targetPath.toString())
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