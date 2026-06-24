package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.exception.PolicyNotFoundException;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeletePolicyCommandHandler {

    private final InsurancePolicyRepository insurancePolicyRepository;
    private final PolicyEventRepository policyEventRepository;

    public DeletePolicyCommandHandler(InsurancePolicyRepository insurancePolicyRepository,
                                      PolicyEventRepository policyEventRepository) {
        this.insurancePolicyRepository = insurancePolicyRepository;
        this.policyEventRepository = policyEventRepository;
    }

    @Transactional
    public void handle(DeletePolicyCommand command) {
        if (!insurancePolicyRepository.existsById(command.id())) {
            throw new PolicyNotFoundException(command.id());
        }

        insurancePolicyRepository.deleteById(command.id());

        try {
            policyEventRepository.deleteByPolicyId(command.id());
        } catch (Exception e) {
            throw new RuntimeException("Event store delete failed; rolling back policy delete", e);
        }
    }
}
