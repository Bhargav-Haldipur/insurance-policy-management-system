package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.scheduler.ExpiryAlertScheduler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class ExpiryAlertController {

    private final ExpiryAlertScheduler expiryAlertScheduler;

    public ExpiryAlertController(ExpiryAlertScheduler expiryAlertScheduler) {
        this.expiryAlertScheduler = expiryAlertScheduler;
    }

    @PostMapping("/trigger-expiry-check")
    public ResponseEntity<String> triggerExpiryCheck() {
        expiryAlertScheduler.checkExpiringPolicies();
        return ResponseEntity.ok("Expiry check triggered successfully");
    }
}
