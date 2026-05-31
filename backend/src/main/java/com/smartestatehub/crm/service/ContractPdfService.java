package com.smartestatehub.crm.service;

import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.model.ContractPayment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractPdfService {

    private final CloudinaryService cloudinaryService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Génère le PDF du contrat au format HTML → PDF, l'uploade sur Cloudinary
     * et retourne l'URL publique.
     */
    public String generateAndUpload(Contract contract) {
        try {
            String html = buildHtml(contract);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(out);
            byte[] pdfBytes = out.toByteArray();

            String clientName = "Client";
            if (contract.getDeal() != null && contract.getDeal().getClientFolder() != null && contract.getDeal().getClientFolder().getClient() != null) {
                clientName = contract.getDeal().getClientFolder().getClient().getFirstName() + "_"
                        + contract.getDeal().getClientFolder().getClient().getLastName();
            }
            // Nettoyage du nom pour éviter les caractères spéciaux
            String cleanClientName = clientName.replaceAll("[^a-zA-Z0-9_-]", "_");
            String publicId = "contract_" + cleanClientName + "_" + java.util.UUID.randomUUID().toString().substring(0, 8) + ".pdf";
            
            // On utilise "image" au lieu de "raw" pour que Cloudinary génère une preview du PDF
            // Suppression de l'extension .pdf redondante si déjà présente dans le publicId
            String finalPublicId = publicId.endsWith(".pdf") ? publicId.substring(0, publicId.length() - 4) : publicId;
            String url = cloudinaryService.upload(pdfBytes, finalPublicId, "contracts", "image");
            log.info("PDF contrat uploadé sur Cloudinary: {}", url);
            return url;

        } catch (Exception e) {
            log.error("Erreur lors de la génération/upload du PDF contrat: {}", e.getMessage(), e);
            return null;
        }
    }

    private String buildHtml(Contract contract) {
        String clientName = "—";
        String clientEmail = "—";
        if (contract.getDeal() != null && contract.getDeal().getClientFolder() != null && contract.getDeal().getClientFolder().getClient() != null) {
            clientName = contract.getDeal().getClientFolder().getClient().getFirstName() + " "
                    + contract.getDeal().getClientFolder().getClient().getLastName();
            clientEmail = contract.getDeal().getClientFolder().getClient().getEmail() != null
                    ? contract.getDeal().getClientFolder().getClient().getEmail() : "—";
        }

        StringBuilder paymentsHtml = new StringBuilder();
        if (contract.getPayments() != null) {
            for (ContractPayment p : contract.getPayments()) {
                paymentsHtml.append("<tr>")
                        .append("<td style='padding:6px 10px;border-bottom:1px solid #eee;'>Versement ").append(p.getPaymentOrder()).append("</td>")
                        .append("<td style='padding:6px 10px;border-bottom:1px solid #eee;text-align:right;'>")
                        .append(String.format("$%,.0f", p.getAmount())).append("</td>")
                        .append("<td style='padding:6px 10px;border-bottom:1px solid #eee;'>")
                        .append(p.getDueDate() != null ? p.getDueDate().format(DATE_FMT) : "—").append("</td>")
                        .append("</tr>");
            }
        }

        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
                  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                  <meta charset="UTF-8"/>
                  <style>
                    body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 40px; font-size: 13px; }
                    h1 { color: #1a1a1a; font-size: 22px; margin-bottom: 4px; }
                    .subtitle { color: #666; font-size: 12px; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 10px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .label { color: #666; }
                    .value { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-size: 11px; }
                    .footer { margin-top: 60px; font-size: 10px; color: #aaa; text-align: center; }
                    .badge { display: inline-block; background: #e8f5e9; color: #388e3c; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
                  </style>
                </head>
                <body>
                  <table width="100%"><tr>
                    <td><h1>Contrat Immobilier</h1><div class="subtitle">SmartEstateHub — Ref: """ + contract.getIdContract() + """
                    </div></td>
                    <td align="right"><span class="badge">""" + contract.getStatus() + """
                    </span></td>
                  </tr></table>

                  <div class="section">
                    <div class="section-title">Client</div>
                    <table><tr>
                      <td class="label" width="40%">Nom</td><td class="value">""" + clientName + """
                      </td></tr><tr>
                      <td class="label">Email</td><td class="value">""" + clientEmail + """
                      </td>
                    </tr></table>
                  </div>

                  <div class="section">
                    <div class="section-title">Conditions Financières</div>
                    <table><tr>
                      <td class="label" width="40%">Prix convenu</td>
                      <td class="value">""" + String.format("$%,.0f", contract.getAgreedPrice() != null ? contract.getAgreedPrice() : 0) + """
                      </td></tr><tr>
                      <td class="label">Dépôt de garantie</td>
                      <td class="value">""" + String.format("$%,.0f", contract.getDepositAmount() != null ? contract.getDepositAmount() : 0) + """
                      </td>
                    </tr></table>
                  </div>

                  <div class="section">
                    <div class="section-title">Calendrier de Paiement</div>
                    <table>
                      <tr><th>Versement</th><th>Montant</th><th>Échéance</th></tr>
                      """ + paymentsHtml + """
                    </table>
                  </div>

                  """ + (contract.getAiRiskSummary() != null && !contract.getAiRiskSummary().isEmpty() ? """
                  <div class="section">
                    <div class="section-title">Notes</div>
                    <p>""" + contract.getAiRiskSummary() + """
                    </p>
                  </div>
                  """ : "") + """

                  <div style="font-style: italic; font-size: 10px; color: #666; text-align: justify; margin: 20px 0;">
                    En signant ce contrat, vous vous engagez formellement à en respecter l'intégralité des clauses.
                    Toute inexécution ou manquement aux obligations stipulées dans le présent acte pourra entraîner
                    des conséquences juridiques et financières importantes, conformément à la législation en vigueur.
                  </div>

                  <div class="section" style="margin-top:50px;">
                    <table width="100%"><tr>
                      <td align="center" style="border-top:1px solid #ccc; padding-top:10px;">
                        <div class="label">Signature Client</div>
                        <div style="height:40px;"></div>
                        <div class="value">""" + clientName + """
                        </div>
                      </td>
                      <td align="center" style="border-top:1px solid #ccc; padding-top:10px;">
                        <div class="label">Signature Agent</div>
                        <div style="height:40px;"></div>
                        <div class="value">SmartEstateHub</div>
                      </td>
                    </tr></table>
                  </div>

                  <div class="footer">
                    Document généré automatiquement par SmartEstateHub ·
                    Contrat #""" + contract.getIdContract() + """
                     · """ + java.time.LocalDate.now().format(DATE_FMT) + """
                  </div>
                </body>
                </html>
                """;
    }
}
