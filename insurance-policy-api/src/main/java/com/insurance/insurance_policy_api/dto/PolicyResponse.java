package com.insurance.insurance_policy_api.dto;

import com.insurance.insurance_policy_api.enums.PolicyStatus;
import com.insurance.insurance_policy_api.enums.PolicyType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PolicyResponse(
        Long id,
        String policyName,
        PolicyStatus status,
        PolicyType policyType,
        String holderName,
        String holderEmail,
        String holderPhone,
        BigDecimal premiumAmount,
        BigDecimal coverageAmount,
        BigDecimal deductible,
        LocalDate coverageStartDate,
        LocalDate coverageEndDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String riskScore,
        String riskReason
) {}
