package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "contract_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContractPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_payment", updatable = false, nullable = false)
    private UUID idPayment;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private Boolean isPaid = false;

    @Column(name = "payment_order")
    private Integer paymentOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contract", nullable = false)
    private Contract contract;
}
