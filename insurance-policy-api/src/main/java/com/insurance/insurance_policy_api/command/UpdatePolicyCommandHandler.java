package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.exception.PolicyNotFoundException;
import com.insurance.insurance_policy_api.exception.PolicyValidationException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import com.insurance.insurance_policy_api.service.AiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Objects;

@Service
public class UpdatePolicyCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(UpdatePolicyCommandHandler.class);

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;
    private final AiService aiService;

    public UpdatePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository,
                                      AiService aiService) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
        this.aiService = aiService;
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

        if (riskInputsChanged(insurancePolicy, command)) {
            try {
                AiService.RiskResult risk = aiService.scoreRisk(command);
                insurancePolicy.setRiskScore(risk.score());
                insurancePolicy.setRiskReason(risk.reason());
            } catch (Exception e) {
                log.warn("Risk re-scoring failed for policy {}; keeping existing score. Error: {}",
                        command.id(), e.getMessage());
            }
        }

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

    private boolean riskInputsChanged(InsurancePolicy existing, UpdatePolicyCommand command) {
        return !Objects.equals(existing.getPolicyType(), command.policyType())
                || !Objects.equals(existing.getCoverageStartDate(), command.coverageStartDate())
                || !Objects.equals(existing.getCoverageEndDate(), command.coverageEndDate())
                || compareBigDecimal(existing.getPremiumAmount(), command.premiumAmount()) != 0
                || compareBigDecimal(existing.getCoverageAmount(), command.coverageAmount()) != 0
                || compareBigDecimal(existing.getDeductible(), command.deductible()) != 0;
    }

    private int compareBigDecimal(BigDecimal a, BigDecimal b) {
        if (a == null && b == null) return 0;
        if (a == null || b == null) return 1;
        return a.compareTo(b);
    }
}
