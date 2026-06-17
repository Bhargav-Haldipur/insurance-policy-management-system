package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.dto.PolicyEventResponse;
import com.insurance.insurance_policy_api.service.PolicyQueryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventQueryController {

    private final PolicyQueryService policyQueryService;

    public EventQueryController(PolicyQueryService policyQueryService) {
        this.policyQueryService = policyQueryService;
    }

    @GetMapping("/{policyId}")
    public ResponseEntity<List<PolicyEventResponse>> getPolicyEvents(@PathVariable Long policyId) {
        return ResponseEntity.ok(policyQueryService.getPolicyEvents(policyId));
    }
}
