package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class UpdatePolicyCommandHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;

    public UpdatePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
    }

    public InsurancePolicy handle(UpdatePolicyCommand command) {
        if (command.getCoverageStartDate() != null
                && command.getCoverageEndDate() != null
                && !command.getCoverageEndDate().isAfter(command.getCoverageStartDate())) {
            throw new IllegalArgumentException("Coverage end date must be after coverage start date");
        }

        InsurancePolicy insurancePolicy = insurancePolicyRepository.findById(command.getId())
                .orElseThrow(() -> new RuntimeException("Insurance policy not found with id: " + command.getId()));

        insurancePolicy.setPolicyName(command.getPolicyName());
        insurancePolicy.setStatus(command.getStatus());
        insurancePolicy.setCoverageStartDate(command.getCoverageStartDate());
        insurancePolicy.setCoverageEndDate(command.getCoverageEndDate());

        InsurancePolicy updatedPolicy = insurancePolicyRepository.save(insurancePolicy);

        PolicyEvent policyEvent = new PolicyEvent();
        policyEvent.setEventType("POLICY_UPDATED");
        policyEvent.setPolicyId(updatedPolicy.getId());
        policyEvent.setTimestamp(LocalDateTime.now());
        policyEvent.setPayload(updatedPolicy.toString());
        policyEventRepository.save(policyEvent);

        return updatedPolicy;
    }
}
