package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.dto.PolicyResponse;
import com.insurance.insurance_policy_api.service.PolicyQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
public class PolicyQueryController {

    private final PolicyQueryService policyQueryService;

    public PolicyQueryController(PolicyQueryService policyQueryService) {
        this.policyQueryService = policyQueryService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyResponse> getPolicy(@PathVariable Long id) {
        return ResponseEntity.ok(policyQueryService.getPolicy(id));
    }

    @GetMapping
    public ResponseEntity<List<PolicyResponse>> getAllPolicies() {
        return ResponseEntity.ok(policyQueryService.getAllPolicies());
    }
}
