# Insurance Policy Management System

A full-stack insurance policy management application with a Spring Boot REST API backend, React/Vite frontend, dual-database storage (MySQL + MongoDB), and an MCP server that exposes the API as tools for Claude.

---

## Architecture

### System Overview

```
Browser (React/Vite)
    ↓  Axios  /api/*
Spring Boot REST API  (port 8080)
    ├── MySQL  — policy records
    └── MongoDB — immutable audit events

Claude Code (MCP Client)
    ↓  JSON-RPC 2.0 over stdio
server.py (FastMCP)
    ↓  HTTP
Spring Boot REST API
```

### CQRS Pattern

The backend enforces a strict command/query separation:

```
Request → Controller (RequestDTO)
              ↓
          Service
              ↓
    CommandHandler / QueryHandler
              ↓
        Repository (MySQL / MongoDB)
              ↓
          Service
              ↓
        ResponseDTO → Response
```

- **`command/`** — state-changing operations. Each command is an immutable record (`CreatePolicyCommand`, `UpdatePolicyCommand`, `DeletePolicyCommand`) paired with a handler that writes to MySQL and appends a `PolicyEvent` to MongoDB.
- **`query/`** — read operations. Each query record is paired with a handler that reads from MySQL or MongoDB.
- **`service/`** — orchestration layer between controllers and handlers. Maps request DTOs to commands/queries and maps results to response DTOs.
- **`controller/`** — thin REST layer, split by responsibility:
  - `PolicyCommandController` — `POST`, `PUT`, `DELETE` on `/api/policies`
  - `PolicyQueryController` — `GET` on `/api/policies`
  - `EventQueryController` — `GET` on `/api/events`

### Dual-Database Design

| Store | Technology | Purpose |
|---|---|---|
| `insurance_db` | MySQL 8 | Insurance policy records (JPA entity `InsurancePolicy`) |
| `insurance_events` | MongoDB 8 | Immutable audit event documents (`PolicyEvent`) |

Every create, update, and delete operation appends an event to MongoDB. Both writes are wrapped in `@Transactional` — if the MongoDB write fails, the MySQL write is rolled back.

---

## Data Model

### InsurancePolicy

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `Long` | auto | Primary key |
| `policyName` | `String` | Yes | |
| `status` | `PolicyStatus` | Yes | `PENDING`, `ACTIVE`, `INACTIVE`, `EXPIRED`, `CANCELLED`, `SUSPENDED` |
| `policyType` | `PolicyType` | Yes | `HEALTH`, `AUTO`, `LIFE`, `HOME`, `PROPERTY` |
| `holderName` | `String` | Yes | Full name of the insured |
| `holderEmail` | `String` | Yes | Must be a valid email address |
| `holderPhone` | `String` | No | |
| `premiumAmount` | `BigDecimal` | Yes | Must be > 0 |
| `coverageAmount` | `BigDecimal` | Yes | Must be > 0 |
| `deductible` | `BigDecimal` | No | Must be ≥ 0 if provided |
| `coverageStartDate` | `LocalDate` | Yes | |
| `coverageEndDate` | `LocalDate` | Yes | Must be after `coverageStartDate` |
| `createdAt` | `LocalDateTime` | auto | Set on persist (IST) |
| `updatedAt` | `LocalDateTime` | auto | Set on update (IST) |

### PolicyEvent (MongoDB audit document)

Every write operation (create / update / delete) appends an immutable event:

| Field | Values |
|---|---|
| `eventType` | `POLICY_CREATED`, `POLICY_UPDATED` |
| `payload` | String representation of the policy at the time of the event |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Data MongoDB |
| Frontend | React 19, Vite, Material-UI (MUI) v9, React Router v7, Axios |
| Databases | MySQL 8, MongoDB 8 |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Containers | Docker, Docker Compose |
| MCP Server | Python, FastMCP, httpx |

---

## Project Structure

```
insurance-policy-management-system/
├── server.py                          # MCP server (Python/FastMCP)
├── .mcp.json                          # MCP server registration config
├── insurance-policy-api/              # Spring Boot backend
│   ├── docker-compose.yml
│   └── src/main/java/com/insurance/insurance_policy_api/
│       ├── command/
│       │   ├── CreatePolicyCommand.java
│       │   ├── CreatePolicyCommandHandler.java
│       │   ├── UpdatePolicyCommand.java
│       │   ├── UpdatePolicyCommandHandler.java
│       │   ├── DeletePolicyCommand.java
│       │   └── DeletePolicyCommandHandler.java
│       ├── query/
│       │   ├── GetPolicyQuery.java / Handler
│       │   ├── GetAllPoliciesQuery.java / Handler
│       │   └── GetPolicyEventsQuery.java / Handler
│       ├── service/
│       │   ├── PolicyCommandService.java
│       │   └── PolicyQueryService.java
│       ├── controller/
│       │   ├── PolicyCommandController.java
│       │   ├── PolicyQueryController.java
│       │   ├── EventQueryController.java
│       │   └── GlobalExceptionHandler.java
│       ├── dto/
│       │   ├── CreatePolicyRequest.java
│       │   ├── UpdatePolicyRequest.java
│       │   ├── PolicyResponse.java
│       │   └── PolicyEventResponse.java
│       ├── entity/InsurancePolicy.java
│       ├── document/PolicyEvent.java
│       ├── enums/
│       │   ├── PolicyStatus.java          # PENDING, ACTIVE, INACTIVE, EXPIRED, CANCELLED, SUSPENDED
│       │   └── PolicyType.java            # HEALTH, AUTO, LIFE, HOME, PROPERTY
│       ├── exception/
│       │   ├── PolicyNotFoundException.java
│       │   └── PolicyValidationException.java
│       └── repository/
│           ├── InsurancePolicyRepository.java
│           └── PolicyEventRepository.java
└── frontend/                          # React/Vite frontend
    └── src/
        ├── pages/
        │   ├── PolicyListPage.jsx     # Table with View/Edit/Events/Delete actions
        │   ├── CreatePolicyPage.jsx   # New policy form
        │   ├── EditPolicyPage.jsx     # Edit existing policy form
        │   ├── ViewPolicyPage.jsx     # Read-only policy detail
        │   └── PolicyEventsPage.jsx   # Audit event history
        └── services/
            └── policy_Service.js      # Axios API calls
```

---

## Setup

### Full Stack via Docker Compose (recommended)

Run from `insurance-policy-api/`:

```bash
docker-compose up --build    # Start MySQL, MongoDB, backend, frontend
docker-compose down          # Stop all services
```

Access points:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

### Backend Only (Maven)

Requires MySQL on port 3306 and MongoDB on port 27017.

```bash
cd insurance-policy-api
mvn clean package
mvn spring-boot:run
mvn test
```

### Frontend Only (npm)

Requires the backend to be running on port 8080.

```bash
cd frontend
npm install
npm run dev        # Dev server with hot reload at http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint check
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/policies` | Create a new policy |
| `GET` | `/api/policies` | List all policies |
| `GET` | `/api/policies/{id}` | Get a policy by ID |
| `PUT` | `/api/policies/{id}` | Update a policy |
| `DELETE` | `/api/policies/{id}` | Delete a policy and its audit events |
| `GET` | `/api/events/{policyId}` | Get the audit event history for a policy |

### Request Body (Create / Update)

```json
{
  "policyName": "John's Auto Policy",
  "status": "ACTIVE",
  "policyType": "AUTO",
  "holderName": "John Doe",
  "holderEmail": "john.doe@example.com",
  "holderPhone": "+91-9876543210",
  "premiumAmount": 1200.00,
  "coverageAmount": 500000.00,
  "deductible": 5000.00,
  "coverageStartDate": "2026-01-01",
  "coverageEndDate": "2027-01-01"
}
```

`holderPhone` and `deductible` are optional; all other fields are required.

### Error Responses

| Status | Thrown by |
|---|---|
| `400 Bad Request` | Bean Validation failure (missing required field, invalid email, non-positive amount, etc.) |
| `400 Bad Request` | `PolicyValidationException` (coverage end date not after start date) |
| `404 Not Found` | `PolicyNotFoundException` (policy ID does not exist) |

Full interactive docs available at `/swagger-ui.html` when the backend is running.

---

## MCP Server

`server.py` is a Model Context Protocol server that exposes the REST API as callable tools for Claude (or any MCP client). Claude Code launches it as a subprocess and communicates via stdin/stdout using JSON-RPC 2.0.

```
Claude Code  ──JSON-RPC 2.0 over stdio──►  server.py  ──HTTP──►  Spring Boot API
```

### Setup

**1. Install dependencies**
```bash
pip install mcp httpx
```

**2. Start the backend**
```bash
cd insurance-policy-api
docker-compose up --build
```

**3. Register with Claude Code**

Update `.mcp.json` in the project root with the absolute path to `server.py`:

```json
{
  "mcpServers": {
    "insurance-policy-api": {
      "command": "python",
      "args": ["/absolute/path/to/server.py"],
      "description": "Tools to manage insurance policies via the Spring Boot REST API"
    }
  }
}
```

### Available Tools

| Tool | HTTP call |
|---|---|
| `list_policies` | `GET /api/policies` |
| `get_policy(policy_id)` | `GET /api/policies/{id}` |
| `create_policy(...)` | `POST /api/policies` |
| `update_policy(...)` | `PUT /api/policies/{id}` |
| `get_policy_events(policy_id)` | `GET /api/events/{policyId}` |

### Example prompts

- "List all insurance policies"
- "Create a HEALTH policy for Jane Smith (jane@example.com), ₹500,000 coverage, ₹1,200 monthly premium, ₹5,000 deductible, starting 2026-01-01 and ending 2027-01-01"
- "Update policy 3 — change the status to SUSPENDED"
- "Delete policy 5"
- "Show the audit history for policy 3"

---

## Configuration

### Profiles

| File | Used when |
|---|---|
| `application.properties` | Local development (MySQL at `localhost:3306`, MongoDB at `localhost:27017`) |
| `application-docker.properties` | Docker Compose (`SPRING_PROFILES_ACTIVE=docker`; hosts `mysql:3306`, `mongo:27017`) |

### Timezone

All timestamps are stored and served in **Asia/Kolkata (IST)**. This is configured in:

- `InsurancePolicy.java` — `@PrePersist`/`@PreUpdate` use `ZoneId.of("Asia/Kolkata")`
- `CreatePolicyCommandHandler.java` / `UpdatePolicyCommandHandler.java` — event timestamps use the same zone
- `application.properties` / `application-docker.properties` — `spring.jpa.properties.hibernate.jdbc.time_zone=Asia/Kolkata`
- `docker-compose.yml` — `TZ: Asia/Kolkata` on the backend service

### Credentials (local development)

| Setting | Value |
|---|---|
| MySQL user | `root` |
| MySQL password | `root` |
| MySQL database | `insurance_db` |
| MongoDB database | `insurance_events` |
