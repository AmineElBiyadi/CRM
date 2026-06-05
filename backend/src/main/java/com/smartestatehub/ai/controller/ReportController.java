package com.smartestatehub.ai.controller;

import com.smartestatehub.ai.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/reports")
@RequiredArgsConstructor
public class ReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping("/weekly")
    public ResponseEntity<byte[]> downloadWeeklyReport() {
        byte[] pdfContent = weeklyReportService.generateWeeklyReportPdf();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=rapport-hebdomadaire.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfContent);
    }
}
