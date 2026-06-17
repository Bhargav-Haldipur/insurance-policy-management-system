package com.insurance.insurance_policy_api.dto;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PolicyResponse {

    private Long id;

    private String policyName;

    private InsurancePolicy.PolicyStatus status;

    private LocalDate coverageStartDate;

    private LocalDate coverageEndDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
