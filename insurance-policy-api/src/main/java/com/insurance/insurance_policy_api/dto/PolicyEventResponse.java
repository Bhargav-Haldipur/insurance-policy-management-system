package com.insurance.insurance_policy_api.dto;

import java.time.LocalDateTime;

public record PolicyEventResponse(
        String id,
        Long policyId,
        String eventType,
        LocalDateTime timestamp,
        String payload
) {}
