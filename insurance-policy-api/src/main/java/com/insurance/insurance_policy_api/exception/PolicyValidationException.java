package com.insurance.insurance_policy_api.exception;

public class PolicyValidationException extends RuntimeException {

    public PolicyValidationException(String message) {
        super(message);
    }
}
