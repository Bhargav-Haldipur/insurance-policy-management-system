package com.insurance.insurance_policy_api.controller;

import com.insurance.insurance_policy_api.exception.PolicyNotFoundException;
import com.insurance.insurance_policy_api.exception.PolicyValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PolicyNotFoundException.class)
    public ResponseEntity<Map<String, String>> handlePolicyNotFoundException(PolicyNotFoundException exception) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", exception.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(PolicyValidationException.class)
    public ResponseEntity<Map<String, String>> handlePolicyValidationException(PolicyValidationException exception) {
        Map<String, String> response = new LinkedHashMap<>();
        response.put("message", exception.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Map<String, String>>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        Map<String, Map<String, String>> response = new LinkedHashMap<>();
        response.put("errors", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
