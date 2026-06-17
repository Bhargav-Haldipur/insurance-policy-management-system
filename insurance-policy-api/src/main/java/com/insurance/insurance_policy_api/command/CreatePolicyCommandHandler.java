package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.exception.PolicyValidationException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class CreatePolicyCommandHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;

    public CreatePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
    }

    @Transactional
    public InsurancePolicy handle(CreatePolicyCommand command) {
        if (command.coverageStartDate() != null
                && command.coverageEndDate() != null
                && !command.coverageEndDate().isAfter(command.coverageStartDate())) {
            throw new PolicyValidationException("Coverage end date must be after coverage start date");
        }

        InsurancePolicy insurancePolicy = new InsurancePolicy();
        insurancePolicy.setPolicyName(command.policyName());
        insurancePolicy.setStatus(command.status());
        insurancePolicy.setCoverageStartDate(command.coverageStartDate());
        insurancePolicy.setCoverageEndDate(command.coverageEndDate());

        InsurancePolicy savedPolicy = insurancePolicyRepository.save(insurancePolicy);

        PolicyEvent policyEvent = new PolicyEvent();
        policyEvent.setEventType("POLICY_CREATED");
        policyEvent.setPolicyId(savedPolicy.getId());
        policyEvent.setTimestamp(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        policyEvent.setPayload(savedPolicy.toString());
        try {
            policyEventRepository.save(policyEvent);
        } catch (Exception e) {
            throw new RuntimeException("Event store write failed; rolling back policy save", e);
        }

        return savedPolicy;
    }
}
