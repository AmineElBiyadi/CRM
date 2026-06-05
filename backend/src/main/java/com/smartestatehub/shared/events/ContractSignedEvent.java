package com.smartestatehub.shared.events;

import com.smartestatehub.crm.model.Contract;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ContractSignedEvent extends ApplicationEvent {
    private final Contract contract;

    public ContractSignedEvent(Object source, Contract contract) {
        super(source);
        this.contract = contract;
    }
}
