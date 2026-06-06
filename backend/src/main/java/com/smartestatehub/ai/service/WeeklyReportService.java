package com.smartestatehub.ai.service;

import com.smartestatehub.crm.dto.AdminAnalyticsDto;
import com.smartestatehub.crm.service.AdminDashboardService;
import com.smartestatehub.shared.util.PdfRenderUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WeeklyReportService {

    private final ChatClient chatClient;
    private final AdminDashboardService adminDashboardService;

    public byte[] generateWeeklyReportPdf() {
        return generatePeriodicReportPdf("week", null, null);
    }

    public byte[] generatePeriodicReportPdf(String periodType, Integer year, Integer month) {
        // 1. Get analytics for the specific period
        AdminAnalyticsDto analyticsData = adminDashboardService.getAdminAnalytics(
            "week".equals(periodType) ? "month" : periodType, 
            year, 
            month
        );
        
        // Re-simplifying: Always use analyticsData for the numbers, and adapt dashboardData if needed
        long totalDossiers = analyticsData.funnel().stream().mapToLong(f -> f.value()).max().orElse(0);
        
        String pipelineStr = analyticsData.funnel().stream()
                .map(s -> String.format("- %s : %d dossiers", s.label(), s.value()))
                .collect(Collectors.joining("\n"));
        
        String agentsStr = analyticsData.topAgent().name() + " (Leader): " + analyticsData.topAgent().selectionReason();

        String sourcesStr = analyticsData.acquisitionSources().stream()
                .map(s -> String.format("- %s : %d%%", s.label(), s.percent()))
                .collect(Collectors.joining("\n"));

        // 3. Prepare the enriched prompt
        String prompt = String.format("""
            Tu es l'expert en stratégie immobilière IA de l'agence 'Rawabet'. 
            Génère un rapport d'analyse HAUTEMENT STRATÉGIQUE et détaillé pour la période sélectionnée.
            
            PÉRIODE : %s
            
            CHIFFRES CLÉS :
            - Dossiers dans le pipeline : %d
            - Taux de conversion moyen : %s
            - Temps moyen de clôture : %d jours
            
            ÉTAT DU FUNNEL :
            %s
            
            PERFORMANCE :
            %s
            
            SOURCES D'ACQUISITION :
            %s
            
            STRUCTURE DU RAPPORT (Markdown) :
            1. RÉSUMÉ EXÉCUTIF : Une vision globale de la santé de l'agence sur cette période.
            2. ANALYSE DU FUNNEL : Interprète les volumes at chaque étape.
            3. DYNAMIQUE COMMERCIALE : Analyse l'efficacité globale et les tendances.
            4. RECOMMANDATIONS STRATÉGIQUES : 3 à 5 actions prioritaires basées sur les données.
            
            Ton ton doit être professionnel, analytique et orienté vers la croissance. 
            Formatte en Markdown avec des titres (##) et des listes.
            """, 
            analyticsData.conversionTitle(),
            totalDossiers,
            analyticsData.conversionSeries().stream().map(m -> String.valueOf(m.conversionRatePercent())).collect(Collectors.joining("%, ")),
            analyticsData.averageDaysToClose(),
            pipelineStr,
            agentsStr,
            sourcesStr
        );

        log.info("Generating periodic strategic report Markdown via LLM for {}...", analyticsData.conversionTitle());
        String markdownReport = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        // 4. Convert Markdown to HTML with enhanced template
        String htmlContent = generateEnhancedHtml(markdownReport, analyticsData);
        
        log.info("Rendering periodic report PDF...");
        return PdfRenderUtil.renderHtmlToPdf(htmlContent);
    }

    private String generateEnhancedHtml(String md, AdminAnalyticsDto analytics) {
        // MD to HTML conversion
        String body = md
                .replaceAll("(?m)^# (.*)$", "<h1>$1</h1>")
                .replaceAll("(?m)^## (.*)$", "<h2>$1</h2>")
                .replaceAll("(?m)^### (.*)$", "<h3>$1</h3>")
                .replaceAll("(?m)^[\\*\\-] (.*)$", "<li>$1</li>")
                .replaceAll("(?s)(<li>.*?</li>)+", "<ul>$0</ul>")
                .replaceAll("(?m)^\\s+$", "")
                .replace("\n", "<br/>");

        // Clean up some common AI artifacts or malformed segments
        body = body.replace("<br/><ul>", "<ul>").replace("</ul><br/>", "</ul>");

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

        // Use a more robust template for Flying Saucer
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html PUBLIC \"-//XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n");
        html.append("<html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"fr\">\n");
        html.append("<head>\n");
        html.append("<meta charset=\"utf-8\"/>\n");
        html.append("<style>\n");
        html.append("  @page { size: A4; margin: 1.5cm; }\n");
        html.append("  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; line-height: 1.4; font-size: 10pt; }\n");
        html.append("  .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 20px; }\n");
        html.append("  .agency-name { font-size: 20pt; font-weight: bold; text-transform: uppercase; }\n");
        html.append("  .report-title { font-size: 12pt; color: #666; }\n");
        html.append("  .date-tag { float: right; background: #1a1a1a; color: white; padding: 4px 12px; font-size: 9pt; font-weight: bold; }\n");
        html.append("  .kpi-container { width: 100%; border-collapse: collapse; margin: 20px 0; }\n");
        html.append("  .kpi-card { width: 33%; padding: 10px; background: #fdfdfd; border: 1px solid #eee; text-align: center; }\n");
        html.append("  .kpi-value { font-size: 16pt; font-weight: bold; color: #1a1a1a; display: block; }\n");
        html.append("  .kpi-label { font-size: 7pt; color: #888; text-transform: uppercase; }\n");
        html.append("  .section-title { font-size: 14pt; font-weight: bold; border-left: 4px solid #1a1a1a; padding-left: 10px; margin-top: 25px; margin-bottom: 10px; background: #f5f5f5; padding-top: 5px; padding-bottom: 5px; }\n");
        html.append("  h2 { font-size: 13pt; color: #333; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }\n");
        html.append("  .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }\n");
        html.append("  .data-table th { background: #1a1a1a; color: white; text-align: left; padding: 6px; }\n");
        html.append("  .data-table td { border-bottom: 1px solid #eee; padding: 6px; }\n");
        html.append("  .ai-content { background: #fff; padding: 10px 0; }\n");
        html.append("  .footer { border-top: 1px solid #eee; padding-top: 8px; margin-top: 30px; font-size: 7pt; color: #aaa; text-align: center; }\n");
        html.append("</style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        
        html.append("<div class=\"header\">\n");
        html.append("  <div class=\"date-tag\">").append(timestamp).append("</div>\n");
        html.append("  <div class=\"agency-name\">RAWABET</div>\n");
        html.append("  <div class=\"report-title\">Analyse Analytique Stratégique</div>\n");
        html.append("</div>\n");

        html.append("<div style=\"text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px;\">")
            .append(analytics.conversionTitle()).append("</div>\n");

        html.append("<table class=\"kpi-container\">\n");
        html.append("  <tr>\n");
        html.append("    <td class=\"kpi-card\"><span class=\"kpi-value\">").append(analytics.averageDaysToClose()).append(" j</span><span class=\"kpi-label\">Délai Moyen Clôture</span></td>\n");
        html.append("    <td class=\"kpi-card\"><span class=\"kpi-value\">").append(analytics.topAgent().name()).append("</span><span class=\"kpi-label\">Top Agent</span></td>\n");
        html.append("    <td class=\"kpi-card\"><span class=\"kpi-value\">").append(String.format("%.1f%%", analytics.conversionSeries().stream().mapToDouble(m -> m.conversionRatePercent()).average().orElse(0.0))).append("</span><span class=\"kpi-label\">Conversion moyenne</span></td>\n");
        html.append("  </tr>\n");
        html.append("</table>\n");

        html.append("<div class=\"section-title\">RÉSUMÉ DU PIPELINE</div>\n");
        html.append("<table class=\"data-table\">\n");
        html.append("  <thead><tr><th>Étape du Funnel</th><th>Nombre de Dossiers</th></tr></thead><tbody>\n");
        for (var f : analytics.funnel()) {
            html.append("<tr><td>").append(f.label()).append("</td><td>").append(f.value()).append("</td></tr>\n");
        }
        html.append("</tbody></table>\n");

        html.append("<div class=\"section-title\">SOURCES D'ACQUISITION</div>\n");
        html.append("<table class=\"data-table\">\n");
        html.append("  <thead><tr><th>Source</th><th>Part de marché</th></tr></thead><tbody>\n");
        for (var s : analytics.acquisitionSources()) {
            html.append("<tr><td>").append(s.label()).append("</td><td>").append(s.percent()).append("%</td></tr>\n");
        }
        html.append("</tbody></table>\n");

        html.append("<div class=\"section-title\">ANALYSE STRATÉGIQUE IA</div>\n");
        html.append("<div class=\"ai-content\">").append(body).append("</div>\n");

        html.append("<div class=\"footer\">Rapport Analytique AI • Rawabet Real Estate • ").append(timestamp).append(" • Engine v2.7</div>\n");
        html.append("</body></html>");

        return html.toString();
    }
}
