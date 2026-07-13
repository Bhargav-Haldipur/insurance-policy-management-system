package com.insurance.insurance_policy_api.service;

import com.insurance.insurance_policy_api.command.PolicyRiskInputs;
import com.insurance.insurance_policy_api.document.PolicyEvent;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final ChatClient chatClient;

    public AiService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public record RiskResult(String score, String reason) {}

    public RiskResult scoreRisk(PolicyRiskInputs inputs) {
        long months = inputs.coverageStartDate().until(inputs.coverageEndDate(), ChronoUnit.MONTHS);

        String userMessage = """
                Assess the underwriting risk for this %s policy:
                - Holder: %s
                - Coverage Amount: %s
                - Coverage Period: %s to %s (%d months)
                - Deductible: %s

                First, briefly reason through the coverage amount (relative to typical
                amounts for this policy type), the coverage period, and the deductible.

                Then end with exactly these two lines:
                RISK_SCORE: LOW|MEDIUM|HIGH
                RISK_REASON: <one sentence explanation>
                """.formatted(
                inputs.policyType(), inputs.holderName(),
                inputs.coverageAmount(), inputs.coverageStartDate(),
                inputs.coverageEndDate(), months,
                inputs.deductible());

        String response = chatClient.prompt()
                .system("""
                        You are an expert insurance underwriting risk analyst. Risk here means
                        the likelihood and severity of a future claim — it has nothing to do
                        with premium, which you should ignore entirely if mentioned anywhere.

                        Reason through these steps:
                        1. Coverage amount — judge it against typical ranges for this policy
                           type, not in isolation:
                           - AUTO: ₹1L-10L is typical; above ₹20L is high (luxury/commercial vehicle)
                           - HEALTH: ₹2L-15L is typical; above ₹25L is high
                           - LIFE: ₹10L-1Cr is typical; above ₹2Cr is high
                           - HOME/PROPERTY: ₹10L-75L is typical; above ₹1.5Cr is high
                           If the coverage amount is implausibly low for the asset/policy type
                           (e.g. a few thousand rupees to insure a vehicle), treat this as a
                           DATA ANOMALY and score HIGH, noting the figures look inconsistent
                           with a real policy.
                        2. Coverage period — longer periods mean more time for something to
                           go wrong. This matters less for LIFE (naturally long-term) than
                           for AUTO/HEALTH, where multi-year terms are unusual.
                        3. Deductible — a lower deductible means the insurer covers more of
                           each claim, raising exposure. No deductible raises it further.
                        4. Weigh all three together, anchored to the policy type's baseline
                           risk profile, to reach a final score.
                        """)
                .user(userMessage)
                .call()
                .content();

        String score = "MEDIUM";
        String reason = "Risk assessment unavailable";
        if (response != null) {
            for (String line : response.lines().toList()) {
                if (line.startsWith("RISK_SCORE:")) score = line.substring("RISK_SCORE:".length()).trim();
                if (line.startsWith("RISK_REASON:")) reason = line.substring("RISK_REASON:".length()).trim();
            }
        }
        return new RiskResult(score, reason);
    }

    public String generateSummary(Long policyId, List<PolicyEvent> events) {
        String eventList = events.stream()
                .map(e -> "- [%s] %s: %s".formatted(e.getTimestamp(), e.getEventType(), e.getPayload()))
                .collect(Collectors.joining("\n"));

        return chatClient.prompt()
                .system("""
                        You are an experienced insurance analyst helping support staff understand policy histories.
                        Write clear, concise plain English. Avoid jargon. Use 2-4 sentences.
                        """)
                .user("Summarise the history of policy #%d for a support agent:\n\n%s"
                        .formatted(policyId, eventList))
                .call()
                .content();
    }
}
