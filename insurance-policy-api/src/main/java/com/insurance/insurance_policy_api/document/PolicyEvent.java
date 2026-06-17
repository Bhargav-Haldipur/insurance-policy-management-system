package com.insurance.insurance_policy_api.document;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "policy_events")
public class PolicyEvent {

    @Id
    private String id;

    private Long policyId;

    private String eventType;

    private LocalDateTime timestamp;

    private String payload;
}
