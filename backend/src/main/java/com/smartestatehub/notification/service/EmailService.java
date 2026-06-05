package com.smartestatehub.notification.service;

public interface EmailService {
    void sendWelcomeEmail(String to, String name);
    void sendPasswordResetEmail(String to, String token, String portal);
    void sendNotificationEmail(String to, String subject, String message);
    void sendContractReadyEmail(String to, String clientName, String pdfUrl);
    void sendMeetingScheduledEmail(String to, String clientName, String agentName, String dateTime, String meetingType);
    void sendOfferReceivedEmail(String to, String clientName, String propertyTitle, Double amount);
    void sendAiGeneratedEmail(String to, String subject, String prompt, java.util.Map<String, Object> context);
    String generateEmailDraft(String prompt, java.util.Map<String, Object> context);
    String improveSubject(String subject);
    void sendCustomEmail(String to, String subject, String body);
}
