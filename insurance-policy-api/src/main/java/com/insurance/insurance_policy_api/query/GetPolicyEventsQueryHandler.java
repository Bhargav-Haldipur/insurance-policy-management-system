package com.insurance.insurance_policy_api.query;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.exception.PolicyNotFoundException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetPolicyEventsQueryHandler {

    private final PolicyEventRepository policyEventRepository;
    private final InsurancePolicyRepository insurancePolicyRepository;

    public GetPolicyEventsQueryHandler(PolicyEventRepository policyEventRepository,
                                       InsurancePolicyRepository insurancePolicyRepository) {
        this.policyEventRepository = policyEventRepository;
        this.insurancePolicyRepository = insurancePolicyRepository;
    }

    public List<PolicyEvent> handle(GetPolicyEventsQuery query) {
        insurancePolicyRepository.findById(query.policyId())
                .orElseThrow(() -> new PolicyNotFoundException(query.policyId()));
        return policyEventRepository.findByPolicyIdOrderByTimestampAsc(query.policyId());
    }
}
