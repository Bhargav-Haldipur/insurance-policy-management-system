#!/bin/bash
# Seeds 10 test insurance policies via the REST API.
# Matches the CreatePolicyRequest DTO from the Insurance Policy Management System.

BASE_URL="http://localhost:8080/api/policies"

# Fields: policyName|status|policyType|holderName|holderEmail|holderPhone|premiumAmount|coverageAmount|deductible|coverageStartDate|coverageEndDate
# holderPhone and deductible are optional — left blank on some entries to exercise that.
POLICIES=(
  "John's Auto Policy|ACTIVE|AUTO|John Doe|john.doe@example.com|+91-9876543210|1200.00|500000.00|5000.00|2026-01-01|2027-01-01"
  "Anita's Health Plan|ACTIVE|HEALTH|Anita Sharma|anita.sharma@example.com||3200.00|200000.00||2026-02-01|2027-02-01"
  "Vikram's Life Cover|PENDING|LIFE|Vikram Singh|vikram.singh@example.com|+91-9123456780|4500.00|750000.00|10000.00|2026-01-15|2046-01-15"
  "Priya's Home Shield|ACTIVE|HOME|Priya Nair|priya.nair@example.com|+91-9988776655|2800.00|1500000.00|15000.00|2026-03-01|2027-03-01"
  "Suresh's Property Guard|SUSPENDED|PROPERTY|Suresh Menon|suresh.menon@example.com||6000.00|2000000.00||2026-01-10|2027-01-10"
  "Deepa's Health Secure|ACTIVE|HEALTH|Deepa Iyer|deepa.iyer@example.com|+91-9871234560|4100.00|300000.00|8000.00|2026-04-01|2027-04-01"
  "Arjun's Auto Cover|INACTIVE|AUTO|Arjun Reddy|arjun.reddy@example.com||1750.00|100000.00||2026-02-20|2027-02-20"
  "Kavita's Home Assure|EXPIRED|HOME|Kavita Joshi|kavita.joshi@example.com|+91-9012345678|3300.00|2200000.00|20000.00|2025-05-01|2026-05-01"
  "Manoj's Life Secure|ACTIVE|LIFE|Manoj Pillai|manoj.pillai@example.com|+91-9345678901|5200.00|900000.00|12000.00|2026-01-25|2041-01-25"
  "Sneha's Property Cover|CANCELLED|PROPERTY|Sneha Rao|sneha.rao@example.com||3900.00|1250000.00||2025-06-01|2026-06-01"
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