package com.insurance.insurance_policy_api.dto;

import com.insurance.insurance_policy_api.enums.PolicyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdatePolicyRequest(
        @NotBlank String policyName,
        @NotNull PolicyStatus status,
        @NotNull LocalDate coverageStartDate,
        @NotNull LocalDate coverageEndDate
) {}
