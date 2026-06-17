# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack Insurance Policy Management System with a Spring Boot REST API backend (Java 21) and React/Vite frontend. Uses dual databases: MySQL for policy data and MongoDB for an event audit trail.

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
mvn clean package                # Build JAR
mvn spring-boot:run              # Run locally (requires MySQL on :3306, MongoDB on :27017)
mvn test                         # Run tests
```

### Frontend (React / Vite)

Run from `frontend/`:
```bash
npm install                      # Install dependencies
npm run dev                      # Dev server with hot reload
npm run build                    # Production build
npm run lint                     # ESLint check
```

## Architecture

### CQRS Pattern (Backend)

The backend strictly separates reads from writes using CQRS:

- **`command/`** — state-changing operations. Each command is a DTO (`CreatePolicyCommand`, `UpdatePolicyCommand`) paired with a handler (`*CommandHandler`) that writes to MySQL and appends a `PolicyEvent` to MongoDB.
- **`query/`** — read operations. Each query object is paired with a handler that reads from MySQL (policies) or MongoDB (events).
- **`controller/`** — thin REST layer. `PolicyController` delegates to command/query handlers. `GlobalExceptionHandler` centralizes error formatting.

### Dual-Database Design

- **MySQL** (`insurance_db`) — `InsurancePolicy` JPA entity, schema managed via `ddl-auto=update` (no migration scripts).
- **MongoDB** (`insurance_events`) — `PolicyEvent` documents. Every create/update command appends an event record, forming an immutable audit trail queryable via `GET /api/events/{policyId}`.

### Frontend Data Flow

`pages/` → `services/policy_Service.js` (Axios) → Spring Boot API

The Vite dev server proxies `/api/*` to the backend (localhost:8080 locally, `http://backend:8080` in Docker). This proxy is configured in `vite.config.js`.

### Key API Endpoints

```
POST   /api/policies           - Create policy
GET    /api/policies           - List all policies
GET    /api/policies/{id}      - Get policy by ID
PUT    /api/policies/{id}      - Update policy
GET    /api/events/{policyId}  - Get audit event history
```

## Configuration

**Local development** uses `application.properties` (MySQL at `localhost:3306`, MongoDB at `localhost:27017`, credentials `root/root`).

**Docker** uses `application-docker.properties` (MySQL at `mysql:3306`, MongoDB at `mongo:27017`), activated automatically by the Docker Compose environment variable `SPRING_PROFILES_ACTIVE=docker`.

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.5, Spring Data JPA, Spring Data MongoDB |
| Frontend | React 19, Vite, Material-UI (MUI) v9, React Router v7, Axios |
| Databases | MySQL 8, MongoDB 8 |
| API Docs | SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`) |
| Containers | Docker, Docker Compose |
