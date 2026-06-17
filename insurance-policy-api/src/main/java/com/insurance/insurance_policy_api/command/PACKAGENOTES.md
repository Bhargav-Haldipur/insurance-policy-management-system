# Command Package

## Purpose

The command package handles write operations in the application.

A command represents an action that changes application state, such as creating or updating an insurance policy.

* CreatePolicyCommand
* UpdatePolicyCommand
* CreatePolicyCommandHandler
* UpdatePolicyCommandHandler

---

## Responsibilities

### Validate business rules

Before saving data, handlers perform business validation.

Example:

```java
if (command.getCoverageStartDate() != null
        && command.getCoverageEndDate() != null
        && !command.getCoverageEndDate().isAfter(command.getCoverageStartDate())) {
    throw new IllegalArgumentException(
            "Coverage end date must be after coverage start date");
}
```

This prevents invalid insurance policies from being persisted.

---

### Create and update domain entities

Handlers convert command objects into InsurancePolicy entities.

Example:

```java
InsurancePolicy insurancePolicy = new InsurancePolicy();

insurancePolicy.setPolicyName(command.getPolicyName());
insurancePolicy.setStatus(command.getStatus());
```

The command object contains request data, while the entity represents the database record.

---

### Persist data

Handlers use repositories to save entities.

Example:

```java
insurancePolicyRepository.save(insurancePolicy);
```

The command package does not directly interact with the database. Database access is delegated to repository classes.

---

### Record domain events

After a successful create or update operation, a PolicyEvent document is created and stored.

Examples:

* POLICY_CREATED
* POLICY_UPDATED

This provides a simple event-sourcing history of policy changes.

---

## Dependencies

The command package depends on:

* InsurancePolicyRepository
* PolicyEventRepository
* InsurancePolicy entity
* PolicyEvent document

---

## Request Flow

Create Policy:

Controller
→ CreatePolicyCommand
→ CreatePolicyCommandHandler
→ InsurancePolicyRepository
→ PolicyEventRepository
→ Database
