package com.smartestatehub.crm.event;

import com.smartestatehub.crm.model.ClientFolder;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class DossierConfirmedEvent extends ApplicationEvent {
    private final ClientFolder folder;

    public DossierConfirmedEvent(Object source, ClientFolder folder) {
        super(source);
        this.folder = folder;
    }
}
