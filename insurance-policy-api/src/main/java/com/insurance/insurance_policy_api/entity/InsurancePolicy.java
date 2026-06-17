package com.insurance.insurance_policy_api.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    public enum PolicyStatus {
        ACTIVE,
        INACTIVE
    }
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}