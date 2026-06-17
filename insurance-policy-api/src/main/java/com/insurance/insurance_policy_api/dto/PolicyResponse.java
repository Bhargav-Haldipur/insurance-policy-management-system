package com.insurance.insurance_policy_api.dto;

import com.insurance.insurance_policy_api.enums.PolicyStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PolicyResponse(
        Long id,
        String policyName,
        PolicyStatus status,
        LocalDate coverageStartDate,
        LocalDate coverageEndDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
