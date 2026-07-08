# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack Insurance Policy Management System with a Spring Boot REST API backend (Java 21) and React/Vite frontend. Uses dual databases: MySQL for policy data and MongoDB for an event audit trail. A Python MCP server (`server.py`) exposes the API as Claude tools.

## Commands

### Full Stack (Docker Compose — preferred)

Run from `insurance-policy-api/`:
```bash
docker-compose up --build        # Start all services (MySQL, MongoDB, backend, frontend)
docker-compose down              # Stop all services
```

Access points:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html

### Backend (Spring Boot / Maven)

Run from `insurance-policy-api/`:
```bash
mvn clean package                         # Build JAR
mvn spring-boot:run                       # Run locally (requires MySQL on :3306, MongoDB on :27017)
mvn test                                  # Run all tests
mvn test -Dtest=ClassName                 # Run a specific test class
```

### Frontend (React / Vite)

Run from `frontend/`:
```bash
npm install                      # Install dependencies
npm run dev                      # Dev server with hot reload
npm run build                    # Production build
npm run preview                  # Preview production build
npm run lint                     # ESLint check
```

### MCP Server

Run from the project root:
```bash
python server.py                 # Starts FastMCP server; connects to http://localhost:8080/api
```

The MCP server is registered in `.mcp.json` and auto-enabled via `.claude/settings.local.json`. It exposes 7 tools mirroring the REST API (`list_policies`, `get_policy`, `create_policy`, `update_policy`, `delete_policy`, `get_policy_events`).

## Architecture

### Backend Layers

Requests flow: `Controller → Service → Command/Query Handler → Repository`

- **`controller/`** — four controllers split by concern: `PolicyCommandController` (POST/PUT/DELETE), `PolicyQueryController` (GET policies), `EventQueryController` (GET events), `ExpiryAlertController` (POST `/api/admin/trigger-expiry-check`). `GlobalExceptionHandler` centralizes error formatting for `PolicyNotFoundException` (404) and `PolicyValidationException` (400).
- **`scheduler/`** — `ExpiryAlertScheduler` runs daily at 09:00 IST (`@Scheduled cron`). It queries MySQL for ACTIVE/PENDING/SUSPENDED policies whose `coverageEndDate` falls within the next 30 days, then writes a deduplicated `EXPIRY_WARNING` event to MongoDB for each (skips if one already exists via `existsByPolicyIdAndEventType`).
- **`service/`** — `PolicyCommandService` and `PolicyQueryService` sit between controllers and CQRS handlers; they map request DTOs to command/query objects and convert results to response DTOs.
- **`command/`** — three commands (`CreatePolicyCommand`, `UpdatePolicyCommand`, `DeletePolicyCommand`), each a record paired with a `*CommandHandler` that writes to MySQL and appends/removes `PolicyEvent` documents in MongoDB.
- **`query/`** — three queries (`GetPolicyQuery`, `GetAllPoliciesQuery`, `GetPolicyEventsQuery`), each paired with a `*QueryHandler` that reads from MySQL or MongoDB.

### Dual-Database Design

- **MySQL** (`insurance_db`) — `InsurancePolicy` JPA entity. Schema managed via `ddl-auto=update`. Timestamps (`createdAt`, `updatedAt`) are set via `@PrePersist`/`@PreUpdate` in the `Asia/Kolkata` timezone.
- **MongoDB** (`insurance_events`) — `PolicyEvent` documents. Every create/update appends an event; delete removes all events for that policy. The scheduler also appends `EXPIRY_WARNING` events (once per policy). Events are ordered by timestamp ascending.

Enums shared across layers: `PolicyStatus` (PENDING, ACTIVE, INACTIVE, EXPIRED, CANCELLED, SUSPENDED) and `PolicyType` (HEALTH, AUTO, LIFE, HOME, PROPERTY).

### API Endpoints

```
POST   /api/policies                    - Create policy
GET    /api/policies                    - List all policies
GET    /api/policies/{id}              - Get policy by ID
PUT    /api/policies/{id}              - Update policy
DELETE /api/policies/{id}              - Delete policy (also removes its MongoDB events)
GET    /api/events/{policyId}          - Get audit event history
POST   /api/admin/trigger-expiry-check - Manually trigger the expiry-warning scheduler
```

### Frontend Data Flow

`pages/` → `services/policy_Service.js` (Axios) → Spring Boot API

Five pages: `PolicyListPage`, `CreatePolicyPage`, `EditPolicyPage`, `ViewPolicyPage`, `PolicyEventsPage`. `PolicyListPage` shows an "Expiring Soon" MUI `Chip` next to `coverageEndDate` for ACTIVE/PENDING/SUSPENDED policies expiring within 31 days (pure client-side check via dayjs). Shared utilities in `utils/dateFormat.js` handle date formatting (`DD MMM YYYY`) and dayjs-to-API-string conversion.

The Vite dev server proxies `/api/*` to `http://localhost:8080` locally and `http://backend:8080` in Docker. The proxy target is controlled in `vite.config.js`.

## Configuration

**Local development** uses `application.properties` (MySQL at `localhost:3306`, MongoDB at `localhost:27017`, credentials `root/root`).

**Docker** uses `application-docker.properties` (MySQL at `mysql:3306`, MongoDB at `mongo:27017`), activated by `SPRING_PROFILES_ACTIVE=docker` set in `docker-compose.yml`. Timezone is `Asia/Kolkata` in both profiles.

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Data MongoDB, Lombok |
| Frontend | React 19, Vite, Material-UI (MUI) v9, React Router v7, Axios, dayjs |
| Databases | MySQL 8, MongoDB 8 |
| API Docs | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`) |
| Containers | Docker, Docker Compose |
| MCP Server | Python, FastMCP, httpx |
