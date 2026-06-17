package com.insurance.insurance_policy_api.query;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetAllPoliciesQueryHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;

    public GetAllPoliciesQueryHandler(InsurancePolicyRepository insurancePolicyRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
    }

    public List<InsurancePolicy> handle(GetAllPoliciesQuery query) {
        return insurancePolicyRepository.findAll();
    }
}
