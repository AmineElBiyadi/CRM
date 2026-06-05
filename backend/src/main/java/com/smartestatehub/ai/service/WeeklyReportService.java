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
            Tu es un consultant en stratégie immobilière pour l'agence 'Rawabet'.
            Génère un rapport hebdomadaire analytique et persuasif.
            
            DONNÉES DE LA SEMAINE (%s) :
            - Dossiers Actifs : %d
            - Clôtures ce mois : %d
            - Taux de conversion : %.1f%%
            - Leads froids : %d
            - Agents actifs : %d
            
            STRUCTURE DU RAPPORT :
            1. Analyse de la Performance : Interprète les chiffres. Est-ce une bonne semaine ?
            2. Points de Vigilance : Analyse les %d leads froids. Pourquoi stagnent-ils ?
            3. Plan d'Action : 3 actions concrètes pour les agents la semaine prochaine.
            
            Formatte en Markdown avec des titres clairs (##). Sois pro, concis et visionnaire.
            """, 
            dashboardData.periodLabel(),
            dashboardData.kpis().activeDossiers(),
            dashboardData.kpis().closedThisMonth(),
            dashboardData.kpis().conversionRatePercent(),
            dashboardData.kpis().coldLeads(),
            dashboardData.agents().size(),
            dashboardData.kpis().coldLeads()
        );

        log.info("Generating weekly report Markdown via LLM...");
        String markdownReport = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        // 3. Convert Markdown to HTML with a professional template
        String htmlContent = generateProfessionalHtml(markdownReport, dashboardData);
        
        log.info("Rendering weekly report PDF...");
        return PdfRenderUtil.renderHtmlToPdf(htmlContent);
    }

    private String generateProfessionalHtml(String md, AdminDashboardDto data) {
        // More robust MD to HTML conversion for Flying Saucer compatibility
        String body = md
                .replaceAll("(?m)^# (.*)$", "<h1>$1</h1>")
                .replaceAll("(?m)^## (.*)$", "<h2>$1</h2>")
                .replaceAll("(?m)^### (.*)$", "<h3>$1</h3>")
                .replaceAll("(?m)^[\\*\\-] (.*)$", "<li>$1</li>")
                .replaceAll("(?s)<li>.*?</li>", "<ul>$0</ul>") // Wrap adjacent list items in <ul>
                .replaceAll("</ul>\\s*<ul>", "") // Merge adjacent <ul> tags
                .replaceAll("\\n", "<br/>");

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="utf-8"/>
                    <style>
                        @page { size: A4; margin: 2cm; }
                        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; line-height: 1.5; font-size: 11pt; }
                        
                        /* Header */
                        .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 30px; }
                        .agency-name { font-size: 24pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
                        .report-title { font-size: 14pt; color: #666; margin-top: 5px; }
                        .date-tag { float: right; background: #1a1a1a; color: white; padding: 5px 15px; font-size: 10pt; font-weight: bold; border-radius: 4px; }
                        
                        /* KPI Table (Classic look for PDF compatibility) */
                        .kpi-container { width: 100%%; border-collapse: collapse; margin: 30px 0; }
                        .kpi-card { width: 25%%; padding: 15px; background: #f9f9f9; border: 1px solid #eee; text-align: center; }
                        .kpi-value { font-size: 18pt; font-weight: bold; color: #1a1a1a; display: block; }
                        .kpi-label { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 1px; }
                        
                        /* Typography */
                        h2 { font-size: 16pt; color: #1a1a1a; border-left: 5px solid #1a1a1a; padding-left: 15px; margin-top: 40px; margin-bottom: 15px; }
                        h3 { font-size: 12pt; font-weight: bold; margin-top: 25px; color: #333; }
                        p { margin-bottom: 10px; text-align: justify; }
                        li { margin-bottom: 8px; }
                        
                        /* Footer */
                        .footer { position: running(footer); border-top: 1px solid #eee; padding-top: 10px; margin-top: 50px; font-size: 8pt; color: #999; text-align: center; }
                        
                        /* Accent boxes */
                        .highlight-box { background: #fffdf2; border: 1px solid #e6dfb3; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="date-tag">%s</div>
                        <div class="agency-name">RAWABET</div>
                        <div class="report-title">Intelligence Stratégique Hebdomadaire</div>
                    </div>

                    <p>Ce rapport présente une analyse consolidée de l'activité de l'agence pour la période du <strong>%s</strong>. Les données sont issues du moteur d'IA SmartEstateHub.</p>

                    <table class="kpi-container">
                        <tr>
                            <td class="kpi-card">
                                <span class="kpi-value">%d</span>
                                <span class="kpi-label">Dossiers Actifs</span>
                            </td>
                            <td class="kpi-card">
                                <span class="kpi-value">%d</span>
                                <span class="kpi-label">Ventes / Mois</span>
                            </td>
                            <td class="kpi-card">
                                <span class="kpi-value">%.1f%%</span>
                                <span class="kpi-label">Conversion</span>
                            </td>
                            <td class="kpi-card">
                                <span class="kpi-value">%d</span>
                                <span class="kpi-label">Leads Froids</span>
                            </td>
                        </tr>
                    </table>

                    <div class="content">
                        %s
                    </div>

                    <div class="footer">
                        Rapport confidentiel • Rawabet Real Estate • Généré le %s par IA Engine v2.0
                    </div>
                </body>
                </html>
                """.formatted(
                        data.periodLabel(),
                        data.periodLabel(),
                        data.kpis().activeDossiers(),
                        data.kpis().closedThisMonth(),
                        data.kpis().conversionRatePercent(),
                        data.kpis().coldLeads(),
                        body,
                        timestamp
                );
    }
}
