package com.smartestatehub.crm.event;

import com.smartestatehub.crm.model.Client;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ClientConfirmedEvent extends ApplicationEvent {
    private final Client client;

    public ClientConfirmedEvent(Object source, Client client) {
        super(source);
        this.client = client;
    }
}
