package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.DocumentDto;
import com.smartestatehub.crm.model.DocumentType;
import com.smartestatehub.crm.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowedHeaders = "*", allowCredentials = "true")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentDto> uploadDocument(
            @RequestParam("dealId") UUID dealId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DocumentType type) throws IOException {
        
        return ResponseEntity.ok(documentService.uploadDocument(dealId, file, type));
    }

    @GetMapping("/deal/{dealId}")
    public ResponseEntity<List<DocumentDto>> getDocumentsByDeal(@PathVariable UUID dealId) {
        return ResponseEntity.ok(documentService.getDocumentsByDeal(dealId));
    }
}