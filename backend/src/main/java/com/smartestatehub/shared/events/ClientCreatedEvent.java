package com.smartestatehub.shared.events;

import com.smartestatehub.crm.model.Client;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ClientCreatedEvent extends ApplicationEvent {
    private final Client client;
    private final String temporaryPassword;

    public ClientCreatedEvent(Object source, Client client, String temporaryPassword) {
        super(source);
        this.client = client;
        this.temporaryPassword = temporaryPassword;
    }
}
