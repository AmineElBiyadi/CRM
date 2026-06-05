package com.smartestatehub.notification.service;

import com.sendgrid.SendGrid;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.Method;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Interaction;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.InteractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final ChatClient chatClient;
    private final DealRepository dealRepository;
    private final InteractionRepository interactionRepository;

    @Value("${app.ai.model-fast}")
    private String fastModel;

    @Value("${app.sendgrid.api-key}")
    private String sendgridApiKey;

    @Value("${app.sendgrid.from-email}")
    private String fromEmail;

    @Value("${app.frontend.admin-url}")
    private String adminUrl;

    @Value("${app.frontend.client-url}")
    private String clientUrl;

    // Template de base pour tous les emails
    private String wrapWithTemplate(String content) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; color: #333; }
                        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eef2f5; }
                        .header { background: #1a1a1a; padding: 40px 20px; text-align: center; }
                        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
                        .content { padding: 40px; line-height: 1.8; font-size: 16px; }
                        .content h2 { color: #1a1a1a; margin-top: 0; font-size: 22px; font-weight: 700; }
                        .button-container { text-align: center; margin: 35px 0; }
                        .button { display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                        .footer { background: #fcfdfe; padding: 30px; text-align: center; border-top: 1px solid #f0f4f8; }
                        .footer p { margin: 5px 0; font-size: 13px; color: #94a3b8; }
                        .highlight-box { background: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #1a1a1a; }
                        .highlight-box p { margin: 10px 0; font-size: 15px; }
                        .highlight-box strong { color: #1a1a1a; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Rawabet</h1>
                        </div>
                        <div class="content">
                            %s
                        </div>
                        <div class="footer">
                            <p><strong>Rawabet</strong> · Excellence Immobilière</p>
                            <p>Agence Immobilière Intelligente</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(content);
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        if (sendgridApiKey == null || sendgridApiKey.isBlank() || sendgridApiKey.startsWith("your_")) {
            log.warn("[MOCK EMAIL] Pas de clé SendGrid valide. Email vers {} non envoyé réellement.", to);
            log.info("Sujet: {} \nContenu: {}", subject, htmlContent);
            return;
        }

        try {
            Email from = new Email(fromEmail, "Rawabet");
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
        String subject = "Bienvenue chez Rawabet !";
        String content = """
                <h2>Bienvenue, %s !</h2>
                <p>Nous sommes ravis de vous compter parmi nous.</p>
                <p><strong>Rawabet</strong> est votre nouvel allié pour une expérience immobilière moderne, transparente et assistée par l'intelligence artificielle.</p>
                <p>Notre équipe est déjà mobilisée pour faire de votre projet une réussite totale.</p>
                """.formatted(name);

        sendEmail(to, subject, wrapWithTemplate(content));
    }

    @Override
    public void sendPasswordResetEmail(String to, String token, String portal) {
        String baseUrl = "CLIENT".equals(portal) ? clientUrl : adminUrl;
        String resetLink = baseUrl + "/reset-password?token=" + token;

        String subject = "Réinitialisation de votre mot de passe — Rawabet";
        String content = """
                <h2>Réinitialisation de mot de passe</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte <strong>Rawabet</strong>.</p>
                <p>Veuillez cliquer sur le bouton ci-dessous pour continuer :</p>
                <div class="button-container">
                    <a href="%s" class="button">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                <p style="font-size: 13px; color: #666;">Ce lien est valable pendant 2 heures. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
                <p style="font-size: 11px; color: #999; word-break: break-all;">Si le bouton ne fonctionne pas, copiez ce lien : %s</p>
                """.formatted(resetLink, resetLink);

        sendEmail(to, subject, wrapWithTemplate(content));
    }

    @Override
    public void sendNotificationEmail(String to, String subject, String message) {
        String content = """
                <h2>Nouvelle notification</h2>
                <p>%s</p>
                """.formatted(message);

        sendEmail(to, subject, wrapWithTemplate(content));
    }

    @Override
    public void sendContractReadyEmail(String to, String clientName, String pdfUrl) {
        String subject = "Votre contrat est prêt à signer — Rawabet";
        String content = """
                <h2>Bonjour %s,</h2>
                <p>Votre conseiller Rawabet vient de finaliser la préparation de votre contrat immobilier.</p>
                <p>Il est désormais disponible pour votre relecture et signature électronique sécurisée.</p>
                <div class="button-container">
                    <a href="%s" target="_blank" class="button">
                        Consulter le contrat (PDF)
                    </a>
                </div>
                <p style="font-size: 13px; color: #64748b;">Si vous avez la moindre question, n'hésitez pas à contacter directement votre agent. Ce lien est accessible pendant 30 jours.</p>
                """.formatted(clientName, pdfUrl);

        sendEmail(to, subject, wrapWithTemplate(content));
    }

    @Override
    public void sendMeetingScheduledEmail(String to, String clientName, String agentName, String dateTime, String meetingType) {
        String subject = "Confirmation de rendez-vous — Rawabet";
        String content = """
                <h2>Confirmation de rendez-vous</h2>
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Votre rencontre a été programmée avec succès dans notre agenda.</p>
                <div class="highlight-box">
                    <p><strong>Agent :</strong> %s</p>
                    <p><strong>Date et heure :</strong> %s</p>
                    <p><strong>Type de rencontre :</strong> %s</p>
                </div>
                <p>Pour toute modification ou annulation, nous vous remercions de contacter votre agent Rawabet dans les plus brefs délais.</p>
                """.formatted(clientName, agentName, dateTime, meetingType);

        sendEmail(to, subject, wrapWithTemplate(content));
    }

    @Override
    public void sendOfferReceivedEmail(String to, String clientName, String propertyTitle, Double amount) {
        String subject = "Nouvelle offre reçue — Rawabet";
        String content = """
                <h2>Nouvelle offre pour votre bien</h2>
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Une nouvelle offre d'achat vient d'être déposée pour votre propriété :</p>
                <div class="highlight-box" style="text-align: center;">
                    <p style="font-size: 14px; margin-bottom: 5px;">%s</p>
                    <p style="font-size: 24px; color: #1a1a1a; font-weight: 800; margin: 0;">$%,.2f</p>
                </div>
                <p>Vous pouvez consulter les détails complets et formuler votre réponse directement depuis votre portail client Rawabet.</p>
                """.formatted(clientName, propertyTitle, amount);

        sendEmail(to, subject, wrapWithTemplate(content));
    }

    @Override
    public void sendAiGeneratedEmail(String to, String subject, String prompt, Map<String, Object> context) {
        log.info("Génération d'un email via IA pour {} - Sujet: {}", to, subject);

        String systemPrompt = """
                Tu es un assistant de communication pour une agence immobilière de luxe "Rawabet".
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

            sendEmail(to, subject, wrapWithTemplate(aiContent));
        } catch (Exception e) {
            log.error("Erreur lors de la génération de l'email par IA: {}", e.getMessage());
            sendNotificationEmail(to, subject, "Une mise à jour importante concernant votre dossier est disponible.");
        }
    }

    @Override
    public String generateEmailDraft(String prompt, Map<String, Object> context) {
        log.info("Génération d'un brouillon d'email via IA avec contexte CRM");

        Map<String, Object> fullContext = new HashMap<>(context);
        
        // Initialisation avec des valeurs par défaut pour éviter les erreurs de template
        fullContext.putIfAbsent("dealStage", "Non spécifiée");
        fullContext.putIfAbsent("aiSummary", "Aucun résumé disponible pour le moment.");
        fullContext.putIfAbsent("recentInteractions", "Aucune interaction passée enregistrée.");
        fullContext.putIfAbsent("clientName", context.getOrDefault("clientName", "Client"));

        // Enrichir le contexte avec les données réelles du CRM si le dealId est présent
        if (context.containsKey("dealId")) {
            try {
                UUID dealId = UUID.fromString(context.get("dealId").toString());
                dealRepository.findById(dealId).ifPresent(deal -> {
                    if (deal.getStage() != null) fullContext.put("dealStage", deal.getStage().toString());
                    if (deal.getAiSummary() != null) fullContext.put("aiSummary", deal.getAiSummary());
                    
                    String recentInteractions = interactionRepository.findTop3ByDeal_IdDealOrderByOccurredAtDesc(dealId)
                            .stream()
                            .map(i -> "- " + i.getType() + ": " + i.getDescription())
                            .collect(Collectors.joining("\n"));
                    
                    if (!recentInteractions.isBlank()) {
                        fullContext.put("recentInteractions", recentInteractions);
                    }
                });
            } catch (Exception e) {
                log.warn("Erreur d'enrichissement du contexte : {}", e.getMessage());
            }
        }

        String systemPrompt = """
                Tu es un assistant de communication pour une agence immobilière de luxe "Rawabet".
                Ta mission est de rédiger le corps d'un email professionnel, chaleureux et personnalisé.
                
                Données du CRM pour ce client :
                - Nom : {clientName}
                - Étape : {dealStage}
                - Résumé dossier : {aiSummary}
                - Historique récent :
                {recentInteractions}
                
                CONSIGNES :
                1. Utilise ces données pour que l'email ne soit PAS générique.
                2. Si le prompt de l'agent est trop vague et que le CRM est vide, réponds par : "[BESOIN_INFOS] : " suivi de tes questions.
                3. Sinon, réponds uniquement avec le contenu de l'email (pas d'objet).
                4. Ton : Expert, luxe, empathique.
                5. Termine TOUJOURS l'email par la signature suivante exactement :
                
                Conseillère en immobilier de luxe
                Rawabet – Votre partenaire de confiance
                +33 1 23 45 67 89 | sara@rawabet.com | www.rawabet.com
                """;

        try {
            return chatClient.prompt()
                    .options(OpenAiChatOptions.builder()
                            .withModel(fastModel)
                            .withTemperature(0.7f)
                            .build())
                    .system(s -> s.text(systemPrompt).params(fullContext))
                    .user(u -> u.text(prompt).params(fullContext))
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Erreur lors de la génération du brouillon par IA: {}", e.getMessage());
            return "Désolé, une erreur est survenue lors de la génération du brouillon. Vérifiez que toutes les données du dossier sont bien remplies.";
        }
    }

    @Override
    public String improveSubject(String subject) {
        log.info("Amélioration de l'objet de l'email via IA");

        String systemPrompt = """
                Tu es un assistant en communication immobilière. 
                Ta mission est de corriger les fautes d'orthographe et d'améliorer la formulation de l'objet d'un email (Subject).
                L'objet doit être professionnel, percutant et adapté au secteur de l'immobilier de luxe.
                Réponds UNIQUEMENT avec l'objet corrigé, sans aucun autre texte ou ponctuation superflue.
                """;

        try {
            return chatClient.prompt()
                    .options(OpenAiChatOptions.builder()
                            .withModel(fastModel)
                            .withTemperature(0.5f)
                            .build())
                    .system(systemPrompt)
                    .user(subject)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Erreur lors de l'amélioration de l'objet: {}", e.getMessage());
            return subject; // Retourner l'original en cas d'erreur
        }
    }

    @Override
    public void sendCustomEmail(String to, String subject, String body) {
        // Pour les emails personnalisés envoyés par l'agent
        String htmlBody = body.replace("\n", "<br/>");
        sendEmail(to, subject, wrapWithTemplate(htmlBody));
    }
}
