package com.smartestatehub.crm.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@Slf4j
public class EmailService {

    @Value("${app.sendgrid.api-key}")
    private String sendgridApiKey;

    @Value("${app.sendgrid.from-email}")
    private String fromEmail;

    /**
     * Envoie un email au client lui signalant que son contrat est prêt à signer.
     */
    public void sendContractReadyEmail(String clientEmail, String clientName, String pdfUrl) {
        try {
            Email from = new Email(fromEmail, "SmartEstateHub");
            Email to = new Email(clientEmail);
            String subject = "Votre contrat est prêt à signer — SmartEstateHub";

            String htmlContent = """
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;">
                      <div style="background:#1a1a1a;padding:24px 32px;border-radius:12px 12px 0 0;">
                        <h1 style="color:#fff;margin:0;font-size:20px;">SmartEstateHub</h1>
                      </div>
                      <div style="padding:32px;background:#fafafa;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;">
                        <p style="font-size:15px;">Bonjour <strong>""" + clientName + """
                        </strong>,</p>
                        <p>Votre agent vient de préparer un contrat immobilier à votre attention. Il est maintenant disponible pour relecture et signature.</p>
                        <div style="margin:28px 0;text-align:center;">
                          <a href=""" + "\"" + pdfUrl + "\"" + """
                             target="_blank"
                             style="background:#1a1a1a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
                            Consulter le contrat (PDF)
                          </a>
                        </div>
                        <p style="font-size:12px;color:#888;">Si vous avez des questions, contactez directement votre agent. Ce lien est valable 30 jours.</p>
                        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
                        <p style="font-size:11px;color:#aaa;text-align:center;">SmartEstateHub · Agence Immobilière Intelligente</p>
                      </div>
                    </div>
                    """;

            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendgridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            log.info("Email contrat envoyé à {} — statut HTTP: {}", clientEmail, response.getStatusCode());

        } catch (IOException e) {
            log.error("Erreur lors de l'envoi de l'email contrat: {}", e.getMessage(), e);
        }
    }
}
