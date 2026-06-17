package com.insurance.insurance_policy_api.query;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import org.springframework.stereotype.Service;

@Service
public class GetPolicyQueryHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;

    public GetPolicyQueryHandler(InsurancePolicyRepository insurancePolicyRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
    }

    public InsurancePolicy handle(GetPolicyQuery query) {
        return insurancePolicyRepository.findById(query.getId())
                .orElseThrow(() -> new RuntimeException("Insurance policy not found with id: " + query.getId()));
    }
}
