# Query Package Notes

The **query package** is responsible for all **read operations** in the application.

This follows the **CQRS (Command Query Responsibility Segregation)** pattern:

* **Commands** = Create/Update data
* **Queries** = Read data

Query handlers contain the business logic required to retrieve information from the database and return it to the controller.

---

# Package Purpose

The query package:

* Retrieves policy information from MySQL
* Retrieves policy event history from MongoDB
* Separates read logic from write logic
* Keeps controllers lightweight
* Improves maintainability and scalability

---



# Query Package Architecture

```text
query
│
├── GetAllPoliciesQuery
├── GetAllPoliciesQueryHandler
│
├── GetPolicyQuery
├── GetPolicyQueryHandler
│
├── GetPolicyEventsQuery
└── GetPolicyEventsQueryHandler
```

### Responsibilities

| Class                       | Responsibility                             |
| --------------------------- | ------------------------------------------ |
| GetAllPoliciesQuery         | Request object for retrieving all policies |
| GetAllPoliciesQueryHandler  | Retrieves all policies                     |
| GetPolicyQuery              | Request object containing policy ID        |
| GetPolicyQueryHandler       | Retrieves one policy                       |
| GetPolicyEventsQuery        | Request object containing policy ID        |
| GetPolicyEventsQueryHandler | Retrieves event history from MongoDB       |

---
