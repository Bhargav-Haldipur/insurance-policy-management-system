package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.query.GetPolicyEventsQuery;
import com.insurance.insurance_policy_api.query.GetPolicyEventsQueryHandler;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final GetPolicyEventsQueryHandler getPolicyEventsQueryHandler;

    public EventController(GetPolicyEventsQueryHandler getPolicyEventsQueryHandler) {
        this.getPolicyEventsQueryHandler = getPolicyEventsQueryHandler;
    }

    @GetMapping("/{policyId}")
    public ResponseEntity<List<PolicyEvent>> getPolicyEvents(@PathVariable Long policyId) {
        GetPolicyEventsQuery query = new GetPolicyEventsQuery();
        query.setPolicyId(policyId);

        return ResponseEntity.ok(getPolicyEventsQueryHandler.handle(query));
    }
}
