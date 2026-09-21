# cache-scenarios Specification

## Purpose

Orchestrates the didactic cache-cascade test script so students can run ordered steps and see pass/fail against expected `source` values.

## Requirements

### Requirement: Didactic scenario script is available
The system SHALL provide a scenario matching the teaching order in `test.http`: configure threshold, first message (AI), same message (exact), similar message (semantic), different message (AI).

#### Scenario: Script steps listed
- **WHEN** the user opens the Cenários page
- **THEN** the ordered steps and each step's expected `source` are visible before execution

### Requirement: Sequential scenario execution
The system SHALL execute scenario steps in order, calling the existing API endpoints (`PUT /config` when needed, `POST /tickets/analyze` for message steps).

#### Scenario: Run all steps
- **WHEN** the user starts a full scenario run and the backend is healthy
- **THEN** each step is executed in order and records the actual `source` from the API

#### Scenario: Step-by-step mode
- **WHEN** the user runs the next pending step only
- **THEN** only that step executes and prior step results remain visible

### Requirement: Assert expected source
For each analyze step, the system SHALL compare the actual `source` to the expected value and mark the step as passed or failed.

#### Scenario: Exact hit assertion passes
- **WHEN** a step expects `exact_cache` and the API returns `source` `exact_cache`
- **THEN** the step is marked passed

#### Scenario: Assertion fails
- **WHEN** a step expects `semantic_cache` but the API returns a different `source`
- **THEN** the step is marked failed and the actual `source` is shown

### Requirement: Scenario run summary
After a run attempt, the system SHALL show how many steps passed versus failed.

#### Scenario: Summary after full run
- **WHEN** all steps have completed (success or fail)
- **THEN** a summary of pass/fail counts is displayed
