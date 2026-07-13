package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.exception.PolicyValidationException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import com.insurance.insurance_policy_api.service.AiService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class CreatePolicyCommandHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;
    private final AiService aiService;

    public CreatePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository,
                                      AiService aiService) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
        this.aiService = aiService;
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
        insurancePolicy.setPolicyType(command.policyType());
        insurancePolicy.setHolderName(command.holderName());
        insurancePolicy.setHolderEmail(command.holderEmail());
        insurancePolicy.setHolderPhone(command.holderPhone());
        insurancePolicy.setPremiumAmount(command.premiumAmount());
        insurancePolicy.setCoverageAmount(command.coverageAmount());
        insurancePolicy.setDeductible(command.deductible());
        insurancePolicy.setCoverageStartDate(command.coverageStartDate());
        insurancePolicy.setCoverageEndDate(command.coverageEndDate());

        AiService.RiskResult risk = aiService.scoreRisk(command);
        insurancePolicy.setRiskScore(risk.score());
        insurancePolicy.setRiskReason(risk.reason());

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
