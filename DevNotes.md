## RideShield Dev Notes

This file is the implementation baseline for finishing the sprint markdowns against the actual repo. The sprint docs are useful references, but they are not the source of truth anymore. The current codebase has already diverged in several places for correctness, Windows compatibility, and maintainability.

### Current Baseline

- Sprint 1 foundation is implemented and working.
- Sprint 2 core modules, routers, schemas, and tests exist in the repo.
- Current backend test status: `23 passed`.
- Current live demo paths work, but scenario outcomes do not yet fully match the narrative in `Sprint_2.md`.

### Important Divergences From Sprint Markdown Files

#### 1. Datetime handling

The sprint markdowns use `datetime.utcnow()` or timezone-aware timestamps somewhat interchangeably.

Current repo rule:
- DB writes must use naive UTC values for columns declared as `DateTime` without timezone.
- Helper pattern used in API write paths:

```python
def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
```

Why:
- Prevents asyncpg errors like:
  - `can't subtract offset-naive and offset-aware datetimes`
- This already affected worker registration, policy flows, and seed data earlier.

Constraint for future Sprint 2 work:
- Do not reintroduce mixed aware/naive datetimes in any DB insert/update path.

#### 2. Pydantic style

The sprint markdowns use old-style `class Config`.

Current repo rule:
- Use Pydantic v2 config style:
  - `ConfigDict`
  - `SettingsConfigDict`

Why:
- The old style produced deprecation warnings in the current environment.

Constraint:
- Any new schemas or schema refactors must stay on Pydantic v2 style.

#### 3. Terminal and Windows readability

The sprint markdowns contain emoji-heavy logging and some mojibake-affected text.

Current repo rule:
- Keep runtime logs and scripts ASCII-safe and readable in Windows PowerShell.
- Use plain `INR` instead of rupee symbols in runtime text where needed.

Why:
- Earlier seed/startup output broke or rendered badly on the current machine.

Constraint:
- New scripts and log messages should stay Windows-safe unless there is a strong reason otherwise.

#### 4. SQL logging vs debug mode

The original flow effectively tied SQL echo noise to debug mode.

Current repo rule:
- `DEBUG` and `SQL_ECHO` are separate settings.

Why:
- We want application debug behavior without unreadable SQL spam in the terminal.

Constraint:
- Do not wire engine echo back to `DEBUG` directly.

#### 5. Docker/Postgres port mapping

Current repo runs the Docker Postgres host binding on `5433`, not `5432`.

Why:
- The user's machine had a local Windows PostgreSQL service already on `5432`.

Files already adapted:
- `docker-compose.yml`
- `.env`
- `.env.example`
- `alembic.ini`
- config/default DB wiring

Constraint:
- Do not revert host-side references back to `5432`.

#### 6. Simulation-only admin helpers

Current repo includes simulation/demo helpers that are not meant for production behavior:
- `POST /api/policies/activate-pending`
  - in simulation mode, acts as a demo-friendly activator
- `POST /api/policies/admin/force-activate`
  - simulation-only force activation

Why:
- Needed for Swagger/demo/testing without waiting 24 real hours.

Constraint:
- Keep these clearly scoped to simulation mode.
- Do not present them as production logic.

### Sprint 1 Notes

Sprint 1 is functionally complete for the current repo baseline:
- workers registration/profile/update/list
- policies plans/create/active/history
- risk scorer
- premium calculator
- seed script
- simulator layer
- health/config checks

Sprint 1 improvements already made beyond markdown:
- root-level venv workflow and Windows PowerShell dev script
- `.gitignore` for local-only markdown planning docs and env files
- readable startup output
- fixed dependency pin (`scikit-learn`)
- config hardening for bad env values such as `DEBUG=release`

### Sprint 2 Notes

Sprint 2 is structurally implemented:
- `backend/core/trigger_engine.py`
- `backend/core/fraud_detector.py`
- `backend/core/decision_engine.py`
- `backend/core/income_verifier.py`
- `backend/core/payout_executor.py`
- `backend/core/claim_processor.py`
- `backend/api/triggers.py`
- `backend/api/events.py`
- `backend/api/claims.py`
- `backend/api/payouts.py`
- `backend/schemas/event.py`
- `backend/schemas/claim.py`
- `backend/schemas/payout.py`
- `scripts/run_scenario.py`

Sprint 2 additions already adapted for the current codebase:
- richer event/claim/payout responses than the initial markdown copy
- simulation-only admin activation path
- seeded data with:
  - 2 active profiles
  - 2 pending profiles
- endpoint tests added for event/claim/payout detail and review flows
- direct fraud detector tests added
- scenario-outcome tests added
- scenario runner calibrated to create realistic legit/fraud/edge personas before activation
- trigger engine now derives a simple social/civic disruption signal instead of always returning `0.0`
- decision engine now applies a bounded fraud-flag penalty so:
  - legitimate claims can auto-approve
  - suspicious claims are pushed down appropriately
  - borderline cases still land in manual review instead of collapsing directly to rejection
- claim stats now use a realistic fraud threshold for `fraud_rate`

Current Sprint 2 verification state:
- backend tests: `28 passed`
- `python -m scripts.run_scenario` now yields the intended narrative:
  - Scenario 1 legitimate rain -> approved + payout
  - Scenario 2 fraud attempt -> rejected
  - Scenario 3 edge case -> delayed -> admin resolution

### Sprint 2 Completion Status

Sprint 2 backend is now complete for the current repo baseline.

Meaning:
- the backend/core-engine scope described in `Sprint_2.md` is implemented
- the implementation is adapted to the current repo constraints
- the scenario runner and tests now match the intended legit/fraud/edge narrative

What is still left is not Sprint 2 backend work. It is later-stage work from architecture / Sprint 3:
- frontend onboarding flow
- worker dashboard
- admin dashboard / analytics UI
- broader product polish outside the backend core

### Deferred Refactors

These are valid, but not part of Sprint 2 completion unless they become blockers.

#### PlanOption schema placement

Current issue:
- `PlanOption` lives in worker schema land but is also used by policy flows.

Possible cleanup:
- move it to a shared `schemas/plans.py`

Priority:
- medium

#### PremiumCalculator return structure

Current state:
- `calculate_all_plans()` returns a tuple

Possible cleanup:
- return a structured dict instead

Priority:
- low

#### Status strings vs enums

Current state:
- statuses like `active`, `pending`, `approved`, `delayed`, `rejected` are plain strings

Possible cleanup:
- convert to enums gradually

Priority:
- medium

#### print vs structured logging

Current state:
- `backend/main.py` still uses `print(...)` for startup/shutdown

Possible cleanup:
- move to proper logging

Priority:
- medium

#### Broad exception handling

Current state:
- a few routes/utilities still catch broad exceptions

Possible cleanup:
- tighten exception boundaries after behavior is stable

Priority:
- low to medium

### Working Rule For Future Sprint 2 Completion

When finishing Sprint 2:

1. Use the current repo behavior as the baseline.
2. Use `Sprint_2.md` as a feature/reference checklist, not as code to copy blindly.
3. Prefer correctness, readability, and testability over markdown literal parity.
4. Preserve:
   - naive UTC DB writes
   - Pydantic v2 config style
   - Windows-safe terminal output
   - separate `SQL_ECHO`
   - simulation-only gating for demo shortcuts

### Immediate Next Step

Sprint 3 is the next step.

The backend is ready for:
- frontend onboarding
- worker dashboard
- admin dashboard
- demo/presentation layer integration
