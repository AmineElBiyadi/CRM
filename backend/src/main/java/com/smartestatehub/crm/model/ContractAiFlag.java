package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contracts_ai_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractAiFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_flag")
    private Long idFlag;

    @Column(name = "flag_type")
    private String flagType;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "saverity")
    private Severity saverity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contract", nullable = false)
    private Contract contract;
}
