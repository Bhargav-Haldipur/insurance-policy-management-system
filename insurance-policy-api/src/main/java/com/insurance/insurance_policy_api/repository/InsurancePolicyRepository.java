package com.insurance.insurance_policy_api.repository;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.enums.PolicyStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InsurancePolicyRepository
        extends JpaRepository<InsurancePolicy, Long> {

    List<InsurancePolicy> findByCoverageEndDateBetweenAndStatusIn(
            LocalDate start, LocalDate end, List<PolicyStatus> statuses);
}