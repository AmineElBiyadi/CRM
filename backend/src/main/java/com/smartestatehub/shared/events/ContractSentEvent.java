package com.smartestatehub.shared.events;

import com.smartestatehub.crm.model.Contract;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ContractSentEvent extends ApplicationEvent {
    private final Contract contract;

    public ContractSentEvent(Object source, Contract contract) {
        super(source);
        this.contract = contract;
    }
}
