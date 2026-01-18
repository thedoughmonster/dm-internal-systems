# Architecture Overview

## High-Level Model
DM Internal Systems is designed as a modular monolith governed by a canonical source of truth.

```
+-------------------+
| Canon (Truth)     |
+-------------------+
        ↓
+-------------------+
| Agents & Governance |
+-------------------+
        ↓
+-------------------+
| Database & Scripts |
+-------------------+
        ↓
+-------------------+
| Web / Interface   |
+-------------------+
```

## Layers
### 1. Canon Layer
Defines authoritative JSON-based models and constitutional rules for SOPs and data objects.

### 2. Agents Layer
Implements governance and validation rules. Agents operate under a lock mechanism ensuring canonical compliance.

### 3. Data & Automation Layer
Handles migration, seeding, and repository context synchronization.

### 4. Web Layer
Provides UI via a Next.js app consuming canonical data from the system context.

## Design Principles
- Declarative > imperative
- Validation > flexibility
- Modular monolith for clarity
- JSON + SQL hybrid persistence
- Machine-enforced consistency
