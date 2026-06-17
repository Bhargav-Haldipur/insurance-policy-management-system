package com.insurance.insurance_policy_api.query;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetPolicyEventsQueryHandler {

    private final PolicyEventRepository policyEventRepository;

    public GetPolicyEventsQueryHandler(PolicyEventRepository policyEventRepository) {
        this.policyEventRepository = policyEventRepository;
    }

    public List<PolicyEvent> handle(GetPolicyEventsQuery query) {
        return policyEventRepository.findByPolicyIdOrderByTimestampAsc(query.policyId());
    }
}
