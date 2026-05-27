package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_contract", updatable = false, nullable = false)
    private UUID idContract;

    @Column(name = "agreed_price")
    private Double agreedPrice;

    @Column(name = "deposit_amount")
    private Double depositAmount;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "contract_status")
    private ContractStatus status = ContractStatus.DRAFT;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "ai_risk_summary", length = 4000)
    private String aiRiskSummary;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_deal", nullable = false)
    private Deal deal;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    private List<ContractPayment> payments;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    private List<ContractAiFlag> aiFlags;
}
