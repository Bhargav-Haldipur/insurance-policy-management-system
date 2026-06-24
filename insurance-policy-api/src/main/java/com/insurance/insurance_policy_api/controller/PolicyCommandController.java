package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.dto.CreatePolicyRequest;
import com.insurance.insurance_policy_api.dto.PolicyResponse;
import com.insurance.insurance_policy_api.dto.UpdatePolicyRequest;
import com.insurance.insurance_policy_api.service.PolicyCommandService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/policies")
public class PolicyCommandController {

    private final PolicyCommandService policyCommandService;

    public PolicyCommandController(PolicyCommandService policyCommandService) {
        this.policyCommandService = policyCommandService;
    }

    @PostMapping
    public ResponseEntity<PolicyResponse> createPolicy(@Valid @RequestBody CreatePolicyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(policyCommandService.createPolicy(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> updatePolicy(@PathVariable Long id,
                                                       @Valid @RequestBody UpdatePolicyRequest request) {
        return ResponseEntity.ok(policyCommandService.updatePolicy(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(@PathVariable Long id) {
        policyCommandService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}
