package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.DocumentDto;
import com.smartestatehub.crm.model.DocumentType;
import com.smartestatehub.crm.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

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

    @GetMapping("/file")
    public ResponseEntity<Resource> getFile(@RequestParam("path") String path) {
        try {
            Path filePath = Paths.get(path);
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}