package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import java.util.UUID;

@Entity
@Table(name = "contracts_ai_flags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractAiFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_flag", updatable = false, nullable = false)
    private UUID idFlag;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "flag_type", nullable = false, columnDefinition = "flag_type")
    private FlagType flagType;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "severity", columnDefinition = "severity")
    private Severity severity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contract", nullable = false)
    private Contract contract;
}
