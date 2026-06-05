package com.smartestatehub.shared.util;

import com.lowagie.text.pdf.BaseFont;
import lombok.extern.slf4j.Slf4j;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;

@Slf4j
public class PdfRenderUtil {

    public static byte[] renderHtmlToPdf(String htmlContent) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            
            // Flying Saucer needs well-formed XML/HTML
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();
            renderer.createPDF(outputStream);
            
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Error rendering PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
