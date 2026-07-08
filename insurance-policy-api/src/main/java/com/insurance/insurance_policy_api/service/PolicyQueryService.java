package com.insurance.insurance_policy_api.service;

import com.insurance.insurance_policy_api.dto.PolicyEventResponse;
import com.insurance.insurance_policy_api.dto.PolicyResponse;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.query.GetAllPoliciesQuery;
import com.insurance.insurance_policy_api.query.GetAllPoliciesQueryHandler;
import com.insurance.insurance_policy_api.query.GetPolicyEventsQuery;
import com.insurance.insurance_policy_api.query.GetPolicyEventsQueryHandler;
import com.insurance.insurance_policy_api.query.GetPolicyQuery;
import com.insurance.insurance_policy_api.query.GetPolicyQueryHandler;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PolicyQueryService {

    private final GetPolicyQueryHandler getPolicyQueryHandler;
    private final GetAllPoliciesQueryHandler getAllPoliciesQueryHandler;
    private final GetPolicyEventsQueryHandler getPolicyEventsQueryHandler;

    public PolicyQueryService(GetPolicyQueryHandler getPolicyQueryHandler,
                              GetAllPoliciesQueryHandler getAllPoliciesQueryHandler,
                              GetPolicyEventsQueryHandler getPolicyEventsQueryHandler) {
        this.getPolicyQueryHandler = getPolicyQueryHandler;
        this.getAllPoliciesQueryHandler = getAllPoliciesQueryHandler;
        this.getPolicyEventsQueryHandler = getPolicyEventsQueryHandler;
    }

    public PolicyResponse getPolicy(Long id) {
        return toResponse(getPolicyQueryHandler.handle(new GetPolicyQuery(id)));
    }

    public List<PolicyResponse> getAllPolicies() {
        return getAllPoliciesQueryHandler.handle(new GetAllPoliciesQuery())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PolicyEventResponse> getPolicyEvents(Long policyId) {
        return getPolicyEventsQueryHandler.handle(new GetPolicyEventsQuery(policyId))
                .stream()
                .map(e -> new PolicyEventResponse(e.getId(), e.getPolicyId(), e.getEventType(), e.getTimestamp(), e.getPayload()))
                .toList();
    }

    private PolicyResponse toResponse(InsurancePolicy policy) {
        return new PolicyResponse(
                policy.getId(),
                policy.getPolicyName(),
                policy.getStatus(),
                policy.getPolicyType(),
                policy.getHolderName(),
                policy.getHolderEmail(),
                policy.getHolderPhone(),
                policy.getPremiumAmount(),
                policy.getCoverageAmount(),
                policy.getDeductible(),
                policy.getCoverageStartDate(),
                policy.getCoverageEndDate(),
                policy.getCreatedAt(),
                policy.getUpdatedAt()
        );
    }
}
