package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CreatePolicyCommandHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;

    public CreatePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
    }

    public InsurancePolicy handle(CreatePolicyCommand command) {
        if (command.getCoverageStartDate() != null
                && command.getCoverageEndDate() != null
                && !command.getCoverageEndDate().isAfter(command.getCoverageStartDate())) {
            throw new IllegalArgumentException("Coverage end date must be after coverage start date");
        }

        InsurancePolicy insurancePolicy = new InsurancePolicy();
        insurancePolicy.setPolicyName(command.getPolicyName());
        insurancePolicy.setStatus(command.getStatus());
        insurancePolicy.setCoverageStartDate(command.getCoverageStartDate());
        insurancePolicy.setCoverageEndDate(command.getCoverageEndDate());

        InsurancePolicy savedPolicy = insurancePolicyRepository.save(insurancePolicy);

        PolicyEvent policyEvent = new PolicyEvent();
        policyEvent.setEventType("POLICY_CREATED");
        policyEvent.setPolicyId(savedPolicy.getId());
        policyEvent.setTimestamp(LocalDateTime.now());
        policyEvent.setPayload(savedPolicy.toString());
        policyEventRepository.save(policyEvent);

        return savedPolicy;
    }
}
