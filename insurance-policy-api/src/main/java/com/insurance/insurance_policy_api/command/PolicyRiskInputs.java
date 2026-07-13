package com.insurance.insurance_policy_api.command;

import com.insurance.insurance_policy_api.enums.PolicyType;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface PolicyRiskInputs {
    PolicyType policyType();
    String holderName();
    BigDecimal coverageAmount();
    BigDecimal premiumAmount();
    BigDecimal deductible();
    LocalDate coverageStartDate();
    LocalDate coverageEndDate();
}
