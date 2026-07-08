package com.insurance.insurance_policy_api.repository;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PolicyEventRepository extends MongoRepository<PolicyEvent, String> {

    List<PolicyEvent> findByPolicyId(Long policyId);

    List<PolicyEvent> findByPolicyIdOrderByTimestampAsc(Long policyId);

    void deleteByPolicyId(Long policyId);

    boolean existsByPolicyIdAndEventType(Long policyId, String eventType);
}
