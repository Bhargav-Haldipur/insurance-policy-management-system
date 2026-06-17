package com.insurance.insurance_policy_api.repository;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsurancePolicyRepository
        extends JpaRepository<InsurancePolicy, Long> {
}