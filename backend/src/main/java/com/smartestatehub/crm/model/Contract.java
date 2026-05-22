package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contract")
    private Long idContract;

    @Column(name = "agreed_price")
    private Double agreedPrice;

    @Column(name = "deposit_amount")
    private Double depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractStatus status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "ai_risk_summary", length = 4000)
    private String aiRiskSummary;

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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = ContractStatus.DRAFT;
        }
    }
}
