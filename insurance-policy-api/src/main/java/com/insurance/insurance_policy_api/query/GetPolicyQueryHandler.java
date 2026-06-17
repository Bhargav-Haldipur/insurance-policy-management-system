package com.insurance.insurance_policy_api.query;

import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.exception.PolicyNotFoundException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import org.springframework.stereotype.Service;

@Service
public class GetPolicyQueryHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;

    public GetPolicyQueryHandler(InsurancePolicyRepository insurancePolicyRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
    }

    public InsurancePolicy handle(GetPolicyQuery query) {
        return insurancePolicyRepository.findById(query.id())
                .orElseThrow(() -> new PolicyNotFoundException(query.id()));
    }
}
