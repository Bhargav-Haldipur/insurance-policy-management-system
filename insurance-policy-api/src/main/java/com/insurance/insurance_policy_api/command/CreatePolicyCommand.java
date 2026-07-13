package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.enums.PolicyStatus;
import com.insurance.insurance_policy_api.enums.PolicyType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePolicyCommand(
        @NotBlank String policyName,
        @NotNull PolicyStatus status,
        @NotNull PolicyType policyType,
        @NotBlank String holderName,
        @NotBlank @Email String holderEmail,
        String holderPhone,
        @NotNull @Positive BigDecimal premiumAmount,
        @NotNull @Positive BigDecimal coverageAmount,
        @PositiveOrZero BigDecimal deductible,
        @NotNull LocalDate coverageStartDate,
        @NotNull LocalDate coverageEndDate
) implements PolicyRiskInputs {}
