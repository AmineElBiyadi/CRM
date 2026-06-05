package com.smartestatehub.ai.service;

import com.smartestatehub.crm.dto.AdminDashboardDto;
import com.smartestatehub.crm.service.AdminDashboardService;
import com.smartestatehub.shared.util.PdfRenderUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class WeeklyReportService {

    private final ChatClient chatClient;
    private final AdminDashboardService adminDashboardService;

    public byte[] generateWeeklyReportPdf() {
        // 1. Get metrics for the current week
        AdminDashboardDto dashboardData = adminDashboardService.getAdminDashboard(null, 0);
        
        // 2. Prepare the prompt for the LLM to generate Markdown
        String prompt = String.format("""
            Génère un rapport hebdomadaire professionnel en Markdown pour une agence immobilière nommée 'Rawabet'.
            Utilise les données suivantes pour l'analyse :
            - Période : %s
            - Nouveaux dossiers : %d
            - Dossiers clôturés : %d
            - Taux de conversion : %.1f%%
            - Leads froids : %d
            - Performance des agents : %d agents actifs
            
            Le rapport doit inclure :
            1. Un résumé des performances.
            2. Une analyse des tendances (comparaison avec les objectifs).
            3. Des recommandations stratégiques pour la semaine prochaine.
            
            Formatte le rapport proprement en Markdown avec des titres (H1, H2), des listes à puces et des tableaux si nécessaire.
            """, 
            dashboardData.periodLabel(),
            dashboardData.kpis().activeDossiers(),
            dashboardData.kpis().closedThisMonth(),
            dashboardData.kpis().conversionRatePercent(),
            dashboardData.kpis().coldLeads(),
            dashboardData.agents().size()
        );

        log.info("Generating weekly report Markdown via LLM...");
        String markdownReport = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        // 3. Convert Markdown to HTML for PDF rendering
        // Since we don't have a MD parser, we'll wrap it in a styled HTML
        String htmlContent = convertMarkdownToHtml(markdownReport);
        
        log.info("Rendering weekly report PDF...");
        return PdfRenderUtil.renderHtmlToPdf(htmlContent);
    }

    private String convertMarkdownToHtml(String md) {
        // Very basic conversion or we can ask the AI to do it.
        // For a professional result, let's wrap it in a nice CSS template.
        
        String body = md
                .replaceAll("(?m)^# (.*)$", "<h1>$1</h1>")
                .replaceAll("(?m)^## (.*)$", "<h2>$1</h2>")
                .replaceAll("(?m)^### (.*)$", "<h3>$1</h3>")
                .replaceAll("(?m)^\\* (.*)$", "<li>$1</li>")
                .replaceAll("(?m)^- (.*)$", "<li>$1</li>")
                .replaceAll("([^\\n]+)\\n", "$1<br/>");

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8"/>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 50px; color: #333; line-height: 1.6; }
                        h1 { color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; }
                        h2 { color: #2c3e50; margin-top: 30px; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
                        .metrics-box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="https://rawabet-assets.s3.amazonaws.com/logo.png" alt="Rawabet" style="height: 50px;"/>
                    </div>
                    %s
                    <div class="footer">
                        Rapport généré automatiquement par l'IA de SmartEstateHub le %s
                    </div>
                </body>
                </html>
                """.formatted(body, LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
    }
}
