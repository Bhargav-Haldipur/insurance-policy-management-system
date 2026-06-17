package com.insurance.insurance_policy_api.service;

import com.insurance.insurance_policy_api.command.CreatePolicyCommand;
import com.insurance.insurance_policy_api.command.CreatePolicyCommandHandler;
import com.insurance.insurance_policy_api.command.UpdatePolicyCommand;
import com.insurance.insurance_policy_api.command.UpdatePolicyCommandHandler;
import com.insurance.insurance_policy_api.dto.CreatePolicyRequest;
import com.insurance.insurance_policy_api.dto.PolicyResponse;
import com.insurance.insurance_policy_api.dto.UpdatePolicyRequest;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import org.springframework.stereotype.Service;

@Service
public class PolicyCommandService {

    private final CreatePolicyCommandHandler createPolicyCommandHandler;
    private final UpdatePolicyCommandHandler updatePolicyCommandHandler;

    public PolicyCommandService(CreatePolicyCommandHandler createPolicyCommandHandler,
                                UpdatePolicyCommandHandler updatePolicyCommandHandler) {
        this.createPolicyCommandHandler = createPolicyCommandHandler;
        this.updatePolicyCommandHandler = updatePolicyCommandHandler;
    }

    public PolicyResponse createPolicy(CreatePolicyRequest request) {
        CreatePolicyCommand command = new CreatePolicyCommand(
                request.policyName(),
                request.status(),
                request.coverageStartDate(),
                request.coverageEndDate()
        );
        return toResponse(createPolicyCommandHandler.handle(command));
    }

    public PolicyResponse updatePolicy(Long id, UpdatePolicyRequest request) {
        UpdatePolicyCommand command = new UpdatePolicyCommand(
                id,
                request.policyName(),
                request.status(),
                request.coverageStartDate(),
                request.coverageEndDate()
        );
        return toResponse(updatePolicyCommandHandler.handle(command));
    }

    private PolicyResponse toResponse(InsurancePolicy policy) {
        return new PolicyResponse(
                policy.getId(),
                policy.getPolicyName(),
                policy.getStatus(),
                policy.getCoverageStartDate(),
                policy.getCoverageEndDate(),
                policy.getCreatedAt(),
                policy.getUpdatedAt()
        );
    }
}
