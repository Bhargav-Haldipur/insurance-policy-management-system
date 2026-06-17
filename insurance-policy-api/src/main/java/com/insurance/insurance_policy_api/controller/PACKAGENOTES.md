For your `PACKAGENOTES.md` in the **controller** package, I'd write something like this:

# Controller Package

## Purpose

The controller package acts as the entry point for HTTP requests coming from clients such as the React frontend.

Controllers receive requests, extract request data, delegate business operations to command/query handlers, and return HTTP responses.

This package follows the CQRS pattern by separating write operations (Commands) from read operations (Queries).

---

## Components

### PolicyController

Handles all insurance policy related REST endpoints.

Base URL:

```text
/policies
```

Responsibilities:

* Create new policies
* Update existing policies
* Retrieve a policy by ID
* Retrieve all policies
* Convert entity objects into API response DTOs

Endpoints:

| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| POST   | /policies      | Create policy    |
| PUT    | /policies/{id} | Update policy    |
| GET    | /policies/{id} | Get policy by ID |
| GET    | /policies      | Get all policies |

### CQRS Usage

Write operations are delegated to command handlers:

```java
CreatePolicyCommandHandler
UpdatePolicyCommandHandler
```

Read operations are delegated to query handlers:

```java
GetPolicyQueryHandler
GetAllPoliciesQueryHandler
```

This keeps controllers thin and prevents business logic from being placed inside HTTP endpoints.

### DTO Mapping

The controller converts:

```java
InsurancePolicy
```

into:

```java
PolicyResponse
```

before sending data back to the client.

This prevents exposing internal entity objects directly through the API.

---

### EventController

Handles policy event history endpoints.

Base URL:

```text
/events
```

Responsibilities:

* Retrieve event sourcing history for a policy
* Delegate event retrieval to query handlers

Endpoint:

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| GET    | /events/{policyId} | Get all events for a policy |

### CQRS Usage

Requests are delegated to:

```java
GetPolicyEventsQueryHandler
```

which retrieves policy events from MongoDB.

Returned data consists of:

```java
PolicyEvent
```

documents representing changes made to a policy over time.

---

### GlobalExceptionHandler

Provides centralized exception handling for the entire application.

Annotation:

```java
@RestControllerAdvice
```

This allows exception handling logic to be separated from individual controllers.

Responsibilities:

* Handle business validation errors
* Handle Bean Validation errors
* Return consistent API error responses

---

## Exception Types

### IllegalArgumentException

Used for business rule violations such as:

```text
Policy not found
Invalid policy state
Invalid date range
```

Response:

```json
{
  "message": "Policy not found"
}
```

HTTP Status:

```text
400 BAD_REQUEST
```

---

### MethodArgumentNotValidException

Triggered when validation annotations fail.

Example:

```java
@NotBlank
private String policyName;
```

Response:

```json
{
  "errors": {
    "policyName": "Policy name is required",
    "coverageEndDate": "End date must be after start date"
  }
}
```

HTTP Status:

```text
400 BAD_REQUEST
```

---
