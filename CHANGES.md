# Changelog — Backend Refactor

All changes are in `insurance-policy-api/src/main/java/com/insurance/insurance_policy_api/` unless noted otherwise.

---

## Step 1 — Extract PolicyStatus enum

**Added**
- `enums/PolicyStatus.java` — top-level enum replacing the nested `InsurancePolicy.PolicyStatus`

**Modified**
- `entity/InsurancePolicy.java` — removed nested `PolicyStatus` enum; added import for `enums.PolicyStatus`
- `command/CreatePolicyCommand.java` — updated import from `InsurancePolicy.PolicyStatus` → `enums.PolicyStatus`
- `command/UpdatePolicyCommand.java` — same import update
- `dto/PolicyResponse.java` — same import update

---

## Step 2 — Convert commands and queries to Java records

**Modified** (Lombok `@Data` classes → immutable records)
- `command/CreatePolicyCommand.java`
- `command/UpdatePolicyCommand.java`
- `query/GetPolicyQuery.java`
- `query/GetAllPoliciesQuery.java`
- `query/GetPolicyEventsQuery.java`

**Modified** (accessor calls updated from `getX()` to `x()`)
- `command/CreatePolicyCommandHandler.java`
- `command/UpdatePolicyCommandHandler.java`
- `query/GetPolicyQueryHandler.java`
- `query/GetPolicyEventsQueryHandler.java`
- `controller/PolicyController.java` — `updatePolicy` now constructs a new `UpdatePolicyCommand` with the path-variable id instead of calling `setId()`
- `controller/EventController.java` — `new GetPolicyEventsQuery(policyId)` replaces setter pattern

---

## Step 3 — RequestDTO records and PolicyResponse record

**Added**
- `dto/CreatePolicyRequest.java` — record with `@NotBlank`/`@NotNull` validation annotations
- `dto/UpdatePolicyRequest.java` — record (id comes from path variable, not body)
- `dto/PolicyEventResponse.java` — record; replaces raw `PolicyEvent` document in API responses

**Modified**
- `dto/PolicyResponse.java` — converted from Lombok `@Data` class to a record
- `controller/PolicyController.java` — `toResponse()` updated to use record constructor instead of setters

---

## Step 4 — Service layer

**Added**
- `service/PolicyCommandService.java` — wraps command handlers; maps `CreatePolicyRequest`/`UpdatePolicyRequest` → commands → `PolicyResponse`
- `service/PolicyQueryService.java` — wraps query handlers; maps entity/document results → `PolicyResponse`/`PolicyEventResponse`

The `toResponse()` mapping logic moved from `PolicyController` into the service classes.

---

## Step 5 — Split controllers

**Added**
- `controller/PolicyCommandController.java` — `POST /api/policies`, `PUT /api/policies/{id}`; delegates to `PolicyCommandService`
- `controller/PolicyQueryController.java` — `GET /api/policies`, `GET /api/policies/{id}`; delegates to `PolicyQueryService`
- `controller/EventQueryController.java` — `GET /api/events/{policyId}`; delegates to `PolicyQueryService`

**Deleted**
- `controller/PolicyController.java`
- `controller/EventController.java`

Data flow after this step:
```
UI → Axios → Controller (RequestDTO) → Service → CommandHandler/QueryHandler → Repo → Service → ResponseDTO → UI
```

---

## Step 6 — Timezone fix (Asia/Kolkata)

**Modified**
- `entity/InsurancePolicy.java` — `@PrePersist`/`@PreUpdate` now use `LocalDateTime.now(ZoneId.of("Asia/Kolkata"))`
- `command/CreatePolicyCommandHandler.java` — event timestamp uses `ZoneId.of("Asia/Kolkata")`
- `command/UpdatePolicyCommandHandler.java` — same
- `src/main/resources/application.properties` — added `spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Kolkata`
- `src/main/resources/application-docker.properties` — same property added
- `docker-compose.yml` — added `TZ: Asia/Kolkata` to backend service environment

---

## Step 7 — Structured exception handling

**Added**
- `exception/PolicyNotFoundException.java` — `RuntimeException` subclass; thrown when a policy ID is not found
- `exception/PolicyValidationException.java` — `RuntimeException` subclass; thrown for business rule violations (e.g., invalid date range)

**Modified**
- `controller/GlobalExceptionHandler.java` — added handlers: `PolicyNotFoundException` → 404, `PolicyValidationException` → 400; removed `IllegalArgumentException` handler (replaced by `PolicyValidationException`)
- `command/CreatePolicyCommandHandler.java` — `IllegalArgumentException` → `PolicyValidationException`
- `command/UpdatePolicyCommandHandler.java` — `IllegalArgumentException` → `PolicyValidationException`; `RuntimeException` ("not found") → `PolicyNotFoundException`
- `query/GetPolicyQueryHandler.java` — `RuntimeException` ("not found") → `PolicyNotFoundException`

---

## Step 8 — MySQL/MongoDB transactional consistency

**Modified**
- `command/CreatePolicyCommandHandler.java` — added `@Transactional`; MongoDB save wrapped in try-catch that re-throws on failure, triggering JPA rollback
- `command/UpdatePolicyCommandHandler.java` — same

If the MongoDB event write fails, the exception propagates out of the `@Transactional` method and Spring rolls back the MySQL policy save, keeping both stores consistent.
