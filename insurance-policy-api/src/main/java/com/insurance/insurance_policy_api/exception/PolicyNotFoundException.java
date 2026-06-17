package com.insurance.insurance_policy_api.exception;

public class PolicyNotFoundException extends RuntimeException {

    public PolicyNotFoundException(Long id) {
        super("Insurance policy not found with id: " + id);
    }
}
