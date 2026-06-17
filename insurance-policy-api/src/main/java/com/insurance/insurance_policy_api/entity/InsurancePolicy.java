package com.insurance.insurance_policy_api.entity;

import com.insurance.insurance_policy_api.enums.PolicyStatus;
import jakarta.persistence.*;
import lombok.Data;

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
    private PolicyStatus status;

    private LocalDate coverageStartDate;

    private LocalDate coverageEndDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

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