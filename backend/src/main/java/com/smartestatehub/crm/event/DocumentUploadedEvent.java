package com.smartestatehub.crm.event;

import com.smartestatehub.crm.model.Document;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class DocumentUploadedEvent extends ApplicationEvent {
    private final Document document;

    public DocumentUploadedEvent(Object source, Document document) {
        super(source);
        this.document = document;
    }
}
