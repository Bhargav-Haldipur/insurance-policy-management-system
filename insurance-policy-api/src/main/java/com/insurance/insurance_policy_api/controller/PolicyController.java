package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.command.CreatePolicyCommand;
import com.insurance.insurance_policy_api.command.CreatePolicyCommandHandler;
import com.insurance.insurance_policy_api.command.UpdatePolicyCommand;
import com.insurance.insurance_policy_api.command.UpdatePolicyCommandHandler;
import com.insurance.insurance_policy_api.dto.PolicyResponse;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.query.GetAllPoliciesQuery;
import com.insurance.insurance_policy_api.query.GetAllPoliciesQueryHandler;
import com.insurance.insurance_policy_api.query.GetPolicyQuery;
import com.insurance.insurance_policy_api.query.GetPolicyQueryHandler;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    private final CreatePolicyCommandHandler createPolicyCommandHandler;
    private final UpdatePolicyCommandHandler updatePolicyCommandHandler;
    private final GetPolicyQueryHandler getPolicyQueryHandler;
    private final GetAllPoliciesQueryHandler getAllPoliciesQueryHandler;

    public PolicyController(CreatePolicyCommandHandler createPolicyCommandHandler,
                            UpdatePolicyCommandHandler updatePolicyCommandHandler,
                            GetPolicyQueryHandler getPolicyQueryHandler,
                            GetAllPoliciesQueryHandler getAllPoliciesQueryHandler) {
        this.createPolicyCommandHandler = createPolicyCommandHandler;
        this.updatePolicyCommandHandler = updatePolicyCommandHandler;
        this.getPolicyQueryHandler = getPolicyQueryHandler;
        this.getAllPoliciesQueryHandler = getAllPoliciesQueryHandler;
    }

    @PostMapping
    public ResponseEntity<PolicyResponse> createPolicy(@Valid @RequestBody CreatePolicyCommand command) {
        InsurancePolicy insurancePolicy = createPolicyCommandHandler.handle(command);

        return ResponseEntity.ok(toResponse(insurancePolicy));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> updatePolicy(@PathVariable Long id,
                                                       @Valid @RequestBody UpdatePolicyCommand command) {
        command.setId(id);
        InsurancePolicy insurancePolicy = updatePolicyCommandHandler.handle(command);

        return ResponseEntity.ok(toResponse(insurancePolicy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyResponse> getPolicy(@PathVariable Long id) {
        GetPolicyQuery query = new GetPolicyQuery();
        query.setId(id);

        InsurancePolicy insurancePolicy = getPolicyQueryHandler.handle(query);

        return ResponseEntity.ok(toResponse(insurancePolicy));
    }

    @GetMapping
    public ResponseEntity<List<PolicyResponse>> getAllPolicies() {
        List<PolicyResponse> policies = getAllPoliciesQueryHandler.handle(new GetAllPoliciesQuery())
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(policies);
    }

    private PolicyResponse toResponse(InsurancePolicy insurancePolicy) {
        PolicyResponse response = new PolicyResponse();
        response.setId(insurancePolicy.getId());
        response.setPolicyName(insurancePolicy.getPolicyName());
        response.setStatus(insurancePolicy.getStatus());
        response.setCoverageStartDate(insurancePolicy.getCoverageStartDate());
        response.setCoverageEndDate(insurancePolicy.getCoverageEndDate());
        response.setCreatedAt(insurancePolicy.getCreatedAt());
        response.setUpdatedAt(insurancePolicy.getUpdatedAt());
        return response;
    }
}
