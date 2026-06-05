package com.smartestatehub.shared.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.Map;

@Getter
public class EmailSentEvent extends ApplicationEvent {
    private final String recipientEmail;
    private final String subject;
    private final String senderEmail;
    private final Map<String, Object> metadata;

    public EmailSentEvent(Object source, String recipientEmail, String subject, String senderEmail, Map<String, Object> metadata) {
        super(source);
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.senderEmail = senderEmail;
        this.metadata = metadata;
    }
}
