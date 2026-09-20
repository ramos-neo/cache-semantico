# Spec Delta

## Purpose

Captures client-side history of ticket analyses so students can observe cache-source patterns and latency without a server-side metrics pipeline.

## ADDED Requirements

### Requirement: Record analyses locally
The system SHALL record successful analyze responses in a client-side history (session and/or persistent browser storage) including timestamp, message, `source`, `elapsed_ms`, and `ai_call_number`.

#### Scenario: Entry added after Lab success
- **WHEN** a successful analyze completes in the Lab (or scenario runner)
- **THEN** a history entry is appended with the telemetry fields above

#### Scenario: Failed request not counted as success path
- **WHEN** an analyze request fails
- **THEN** the system does not append a successful cascade entry (MAY record an error entry distinctly)

### Requirement: History list and detail
The Observabilidade page SHALL list history entries and allow inspecting one entry's key telemetry.

#### Scenario: View history list
- **WHEN** the user opens Observabilidade with existing entries
- **THEN** the entries are listed ordered by most recent first

#### Scenario: Inspect entry
- **WHEN** the user selects an entry
- **THEN** details including `source`, `elapsed_ms`, and message are shown

### Requirement: Aggregate by source
The system SHALL show counts of history entries grouped by `source` (`exact_cache`, `semantic_cache`, `ai_model`).

#### Scenario: Counts update
- **WHEN** new successful entries exist for multiple sources
- **THEN** the aggregation reflects the correct count per source

### Requirement: Clear history
The user SHALL be able to clear the local history.

#### Scenario: Clear all
- **WHEN** the user confirms clearing history
- **THEN** the list and aggregations become empty
