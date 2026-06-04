package com.smartestatehub.notification.service;

import com.sendgrid.SendGrid;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.Method;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final ChatClient chatClient;

    @Value("${app.ai.model-fast}")
    private String fastModel;

    @Value("${app.sendgrid.api-key}")
    private String sendgridApiKey;

    @Value("${app.sendgrid.from-email}")
    private String fromEmail;

    private void sendEmail(String to, String subject, String htmlContent) {
        if (sendgridApiKey == null || sendgridApiKey.isBlank() || sendgridApiKey.startsWith("your_")) {
            log.warn("[MOCK EMAIL] Pas de clé SendGrid valide. Email vers {} non envoyé réellement.", to);
            log.info("Sujet: {} \nContenu: {}", subject, htmlContent);
            return;
        }

        try {
            Email from = new Email(fromEmail, "SmartEstateHub");
            Email recipient = new Email(to);
            Content content = new Content("text/html", htmlContent);
            Mail mail = new Mail(from, subject, recipient, content);

            SendGrid sg = new SendGrid(sendgridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            log.info("Email '{}' envoyé à {} — Statut SendGrid: {}", subject, to, response.getStatusCode());

            if (response.getStatusCode() >= 400) {
                log.error("Erreur SendGrid: {}", response.getBody());
            }

        } catch (IOException e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", to, e.getMessage());
        }
    }

    @Override
    public void sendWelcomeEmail(String to, String name) {
        String subject = "Bienvenue chez SmartEstateHub !";
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
                    <h2 style="color: #1a1a1a;">Bienvenue, %s !</h2>
                    <p>Nous sommes ravis de vous compter parmi nous.</p>
                    <p>SmartEstateHub est votre nouvel allié pour la gestion immobilière intelligente.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #888;">L'équipe SmartEstateHub</p>
                </div>
                """.formatted(name);

        sendEmail(to, subject, html);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Réinitialisation de votre mot de passe — SmartEstateHub";
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
                    <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #fff; margin: 0; font-size: 20px;">SmartEstateHub</h1>
                    </div>
                    <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                        <h2 style="color: #1a1a1a;">Réinitialisation de mot de passe</h2>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                        <p>Veuillez cliquer sur le lien ci-dessous pour continuer :</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="http://localhost:5173/reset-password?token=%s" 
                               style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Réinitialiser mon mot de passe
                            </a>
                        </div>
                        <p style="font-size: 13px; color: #666;">Ce lien est valable pendant 2 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                        <p style="font-size: 12px; color: #888; text-align: center;">L'équipe SmartEstateHub</p>
                    </div>
                </div>
                """.formatted(token);

        sendEmail(to, subject, html);
    }

    @Override
    public void sendNotificationEmail(String to, String subject, String message) {
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
                    <h2 style="color: #1a1a1a;">Nouvelle notification</h2>
                    <p>%s</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #888;">L'équipe SmartEstateHub</p>
                </div>
                """.formatted(message);

        sendEmail(to, subject, html);
    }

    @Override
    public void sendContractReadyEmail(String to, String clientName, String pdfUrl) {
        String subject = "Votre contrat est prêt à signer — SmartEstateHub";
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;">
                  <div style="background:#1a1a1a;padding:24px 32px;border-radius:12px 12px 0 0;">
                    <h1 style="color:#fff;margin:0;font-size:20px;">SmartEstateHub</h1>
                  </div>
                  <div style="padding:32px;background:#fafafa;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;">
                    <p style="font-size:15px;">Bonjour <strong>%s</strong>,</p>
                    <p>Votre agent vient de préparer un contrat immobilier à votre attention. Il est maintenant disponible pour relecture et signature.</p>
                    <div style="margin:28px 0;text-align:center;">
                      <a href="%s"
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
                """.formatted(clientName, pdfUrl);

        sendEmail(to, subject, html);
    }

    @Override
    public void sendMeetingScheduledEmail(String to, String clientName, String agentName, String dateTime, String meetingType) {
        String subject = "Confirmation de rendez-vous — SmartEstateHub";
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
                    <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #fff; margin: 0; font-size: 20px;">SmartEstateHub</h1>
                    </div>
                    <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                        <h2>Confirmation de rendez-vous</h2>
                        <p>Bonjour <strong>%s</strong>,</p>
                        <p>Votre rendez-vous a été programmé avec succès.</p>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Agent :</strong> %s</p>
                            <p><strong>Date et heure :</strong> %s</p>
                            <p><strong>Type de rencontre :</strong> %s</p>
                        </div>
                        <p>Si vous avez besoin de modifier ou d'annuler ce rendez-vous, veuillez contacter votre agent directement.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                        <p style="font-size: 12px; color: #888; text-align: center;">SmartEstateHub · Votre partenaire immobilier</p>
                    </div>
                </div>
                """.formatted(clientName, agentName, dateTime, meetingType);

        sendEmail(to, subject, html);
    }

    @Override
    public void sendOfferReceivedEmail(String to, String clientName, String propertyTitle, Double amount) {
        String subject = "Nouvelle offre reçue — SmartEstateHub";
        String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
                    <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h1 style="color: #fff; margin: 0; font-size: 20px;">SmartEstateHub</h1>
                    </div>
                    <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                        <h2>Nouvelle offre pour votre bien</h2>
                        <p>Bonjour <strong>%s</strong>,</p>
                        <p>Une nouvelle offre a été déposée pour la propriété : <strong>%s</strong>.</p>
                        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <p style="font-size: 18px; color: #1a1a1a; font-weight: bold;">Montant de l'offre : %,.2f €</p>
                        </div>
                        <p>Vous pouvez consulter les détails de l'offre et y répondre depuis votre portail client.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                        <p style="font-size: 12px; color: #888; text-align: center;">SmartEstateHub · L'immobilier en toute simplicité</p>
                    </div>
                </div>
                """.formatted(clientName, propertyTitle, amount);

        sendEmail(to, subject, html);
    }

    @Override
    public void sendAiGeneratedEmail(String to, String subject, String prompt, Map<String, Object> context) {
        log.info("Génération d'un email via IA pour {} - Sujet: {}", to, subject);

        String systemPrompt = """
                Tu es un assistant de communication pour une agence immobilière de luxe "SmartEstateHub".
                Ta mission est de rédiger le corps d'un email professionnel, chaleureux et persuasif.
                Utilise les informations fournies dans le contexte pour personnaliser le message.
                Réponds uniquement avec le contenu HTML du corps de l'email (sans balises <html> ou <body>, juste le contenu).
                Le ton doit être expert et rassurant.
                """;

        try {
            String aiContent = chatClient.prompt()
                    .options(OpenAiChatOptions.builder()
                            .withModel(fastModel)
                            .withTemperature(0.7f)
                            .build())
                    .system(systemPrompt)
                    .user(u -> u.text(prompt).params(context))
                    .call()
                    .content();

            String finalHtml = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
                        <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #fff; margin: 0; font-size: 20px;">SmartEstateHub</h1>
                        </div>
                        <div style="padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                            %s
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                            <p style="font-size: 12px; color: #888; text-align: center;">SmartEstateHub · Excellence Immobilière</p>
                        </div>
                    </div>
                    """.formatted(aiContent);

            sendEmail(to, subject, finalHtml);
        } catch (Exception e) {
            log.error("Erreur lors de la génération de l'email par IA: {}", e.getMessage());
            sendNotificationEmail(to, subject, "Une mise à jour importante concernant votre dossier est disponible.");
        }
    }
}
