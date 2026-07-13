package com.insurance.insurance_policy_api.entity;

import com.insurance.insurance_policy_api.enums.PolicyStatus;
import com.insurance.insurance_policy_api.enums.PolicyType;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "insurance_policy")
@Data
public class InsurancePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String policyName;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private PolicyStatus status;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(50)")
    private PolicyType policyType;

    private String holderName;

    private String holderEmail;

    private String holderPhone;

    private BigDecimal premiumAmount;

    private BigDecimal coverageAmount;

    private BigDecimal deductible;

    private LocalDate coverageStartDate;

    private LocalDate coverageEndDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String riskScore;

    private String riskReason;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
        updatedAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now(ZoneId.of("Asia/Kolkata"));
    }
}