#!/bin/bash
# Seeds 10 test insurance policies via the REST API.
# Matches the CreatePolicyRequest DTO from the Insurance Policy Management System.
# Note: riskScore/riskReason are set automatically by AiService on create — not sent in the request.
#
# Risk model is now premium-independent (Option B): scoring is based on
# coverage amount (relative to policy-type norms), coverage period, and
# deductible. Premium amount is still required by the DTO but no longer
# affects the AI risk score, so these entries vary coverage/duration/deductible
# instead — each is tagged with its intended risk tier below.

BASE_URL="http://localhost:8080/api/policies"

# Fields: policyName|status|policyType|holderName|holderEmail|holderPhone|premiumAmount|coverageAmount|deductible|coverageStartDate|coverageEndDate
# holderPhone and deductible are optional — left blank on some entries to exercise that.
POLICIES=(
  # LOW — typical AUTO coverage, standard 1yr term, moderate deductible
  "John's Auto Policy|ACTIVE|AUTO|John Doe|john.doe@example.com|+91-9876543210|1200.00|500000.00|5000.00|2026-01-01|2027-01-01"
  # MEDIUM — HEALTH coverage near upper-typical range, deductible present
  "Anita's Health Plan|ACTIVE|HEALTH|Anita Sharma|anita.sharma@example.com||3200.00|2000000.00|10000.00|2026-02-01|2027-02-01"
  # HIGH — LIFE coverage above typical ceiling, long 30yr term, NO deductible
  "Vikram's Life Cover|PENDING|LIFE|Vikram Singh|vikram.singh@example.com|+91-9123456780|9500.00|25000000.00||2026-01-15|2056-01-15"
  # MEDIUM/HIGH — HOME coverage above typical range, moderate deductible
  "Priya's Home Shield|ACTIVE|HOME|Priya Nair|priya.nair@example.com|+91-9988776655|9800.00|8000000.00|15000.00|2026-03-01|2027-03-01"
  # HIGH — PROPERTY coverage well above typical ceiling, NO deductible
  "Suresh's Property Guard|SUSPENDED|PROPERTY|Suresh Menon|suresh.menon@example.com||14000.00|20000000.00||2026-01-10|2027-01-10"
  # LOW — typical HEALTH coverage, standard term, deductible present
  "Deepa's Health Secure|ACTIVE|HEALTH|Deepa Iyer|deepa.iyer@example.com|+91-9871234560|4100.00|300000.00|8000.00|2026-04-01|2027-04-01"
  # HIGH (anomaly) — implausibly low AUTO coverage, should trigger data-anomaly rule
  "Arjun's Auto Cover|INACTIVE|AUTO|Arjun Reddy|arjun.reddy@example.com||1750.00|1000.00||2026-02-20|2027-02-20"
  # LOW — typical HOME coverage, standard term, deductible present
  "Kavita's Home Assure|EXPIRED|HOME|Kavita Joshi|kavita.joshi@example.com|+91-9012345678|13300.00|1500000.00|20000.00|2025-05-01|2026-05-01"
  # MEDIUM — LIFE coverage mid-typical range, long 15yr term, deductible present
  "Manoj's Life Secure|ACTIVE|LIFE|Manoj Pillai|manoj.pillai@example.com|+91-9345678901|11200.00|5000000.00|12000.00|2026-01-25|2041-01-25"
  # MEDIUM — PROPERTY coverage mid-typical range, standard term, NO deductible
  "Sneha's Property Cover|CANCELLED|PROPERTY|Sneha Rao|sneha.rao@example.com||9900.00|3000000.00||2025-06-01|2026-06-01"
)

SUCCESS=0
FAIL=0

for entry in "${POLICIES[@]}"; do
  IFS='|' read -r policyName status policyType holderName holderEmail holderPhone premiumAmount coverageAmount deductible startDate endDate <<< "$entry"

  # Optional fields: only include if non-empty
  PHONE_FIELD=""
  if [[ -n "$holderPhone" ]]; then
    PHONE_FIELD="\"holderPhone\": \"$holderPhone\","
  fi

  DEDUCTIBLE_FIELD=""
  if [[ -n "$deductible" ]]; then
    DEDUCTIBLE_FIELD="\"deductible\": $deductible,"
  fi

  PAYLOAD=$(cat <<EOF
{
  "policyName": "$policyName",
  "status": "$status",
  "policyType": "$policyType",
  "holderName": "$holderName",
  "holderEmail": "$holderEmail",
  $PHONE_FIELD
  "premiumAmount": $premiumAmount,
  "coverageAmount": $coverageAmount,
  $DEDUCTIBLE_FIELD
  "coverageStartDate": "$startDate",
  "coverageEndDate": "$endDate"
}
EOF
)

  HTTP_STATUS=$(curl -s -o /tmp/resp.json -w "%{http_code}" \
    -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  if [[ "$HTTP_STATUS" =~ ^2 ]]; then
    echo "✅ Created \"$policyName\" ($holderName) — HTTP $HTTP_STATUS"
    SUCCESS=$((SUCCESS+1))
  else
    echo "❌ Failed \"$policyName\" — HTTP $HTTP_STATUS"
    cat /tmp/resp.json
    echo ""
    FAIL=$((FAIL+1))
  fi
done

echo ""
echo "Done. $SUCCESS succeeded, $FAIL failed."