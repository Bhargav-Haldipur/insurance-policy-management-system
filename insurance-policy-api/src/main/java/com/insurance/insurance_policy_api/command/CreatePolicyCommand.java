package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreatePolicyCommand {

    @NotBlank
    private String policyName;

    @NotNull
    private InsurancePolicy.PolicyStatus status;

    @NotNull
    private LocalDate coverageStartDate;

    @NotNull
    private LocalDate coverageEndDate;
}
