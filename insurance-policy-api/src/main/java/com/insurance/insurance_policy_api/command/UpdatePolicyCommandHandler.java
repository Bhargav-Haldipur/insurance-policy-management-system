package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.exception.PolicyNotFoundException;
import com.insurance.insurance_policy_api.exception.PolicyValidationException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class UpdatePolicyCommandHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;

    public UpdatePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
    }

    @Transactional
    public InsurancePolicy handle(UpdatePolicyCommand command) {
        if (command.coverageStartDate() != null
                && command.coverageEndDate() != null
                && !command.coverageEndDate().isAfter(command.coverageStartDate())) {
            throw new PolicyValidationException("Coverage end date must be after coverage start date");
        }

        InsurancePolicy insurancePolicy = insurancePolicyRepository.findById(command.id())
                .orElseThrow(() -> new PolicyNotFoundException(command.id()));

        insurancePolicy.setPolicyName(command.policyName());
        insurancePolicy.setStatus(command.status());
        insurancePolicy.setPolicyType(command.policyType());
        insurancePolicy.setHolderName(command.holderName());
        insurancePolicy.setHolderEmail(command.holderEmail());
        insurancePolicy.setHolderPhone(command.holderPhone());
        insurancePolicy.setPremiumAmount(command.premiumAmount());
        insurancePolicy.setCoverageAmount(command.coverageAmount());
        insurancePolicy.setDeductible(command.deductible());
        insurancePolicy.setCoverageStartDate(command.coverageStartDate());
        insurancePolicy.setCoverageEndDate(command.coverageEndDate());

        InsurancePolicy updatedPolicy = insurancePolicyRepository.save(insurancePolicy);

        PolicyEvent policyEvent = new PolicyEvent();
        policyEvent.setEventType("POLICY_UPDATED");
        policyEvent.setPolicyId(updatedPolicy.getId());
        policyEvent.setTimestamp(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        policyEvent.setPayload(updatedPolicy.toString());
        try {
            policyEventRepository.save(policyEvent);
        } catch (Exception e) {
            throw new RuntimeException("Event store write failed; rolling back policy save", e);
        }

        return updatedPolicy;
    }
}
