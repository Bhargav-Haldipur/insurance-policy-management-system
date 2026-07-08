package com.insurance.insurance_policy_api.scheduler;

import com.insurance.insurance_policy_api.document.PolicyEvent;
import com.insurance.insurance_policy_api.entity.InsurancePolicy;
import com.insurance.insurance_policy_api.enums.PolicyStatus;
import com.insurance.insurance_policy_api.repository.InsurancePolicyRepository;
import com.insurance.insurance_policy_api.repository.PolicyEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
public class ExpiryAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExpiryAlertScheduler.class);
    private static final String EVENT_TYPE = "EXPIRY_WARNING";
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final List<PolicyStatus> WARNABLE_STATUSES =
            List.of(PolicyStatus.ACTIVE, PolicyStatus.PENDING, PolicyStatus.SUSPENDED);

    private final InsurancePolicyRepository policyRepository;
    private final PolicyEventRepository eventRepository;

    public ExpiryAlertScheduler(InsurancePolicyRepository policyRepository,
                                PolicyEventRepository eventRepository) {
        this.policyRepository = policyRepository;
        this.eventRepository = eventRepository;
    }

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void checkExpiringPolicies() {
        LocalDate today = LocalDate.now(IST);
        LocalDate cutoff = today.plusDays(30);

        List<InsurancePolicy> candidates =
                policyRepository.findByCoverageEndDateBetweenAndStatusIn(today, cutoff, WARNABLE_STATUSES);

        log.info("Expiry alert job: {} candidate(s) found for window {} to {}", candidates.size(), today, cutoff);

        int warned = 0;
        for (InsurancePolicy policy : candidates) {
            if (eventRepository.existsByPolicyIdAndEventType(policy.getId(), EVENT_TYPE)) {
                log.debug("Skipping policy {} — EXPIRY_WARNING already recorded", policy.getId());
                continue;
            }

            PolicyEvent event = new PolicyEvent();
            event.setEventType(EVENT_TYPE);
            event.setPolicyId(policy.getId());
            event.setTimestamp(LocalDateTime.now(IST));
            event.setPayload(policy.toString());
            eventRepository.save(event);
            warned++;
            log.info("EXPIRY_WARNING recorded for policy {} (expires {})", policy.getId(), policy.getCoverageEndDate());
        }

        log.info("Expiry alert job complete: {} new warning(s) written", warned);
    }
}
