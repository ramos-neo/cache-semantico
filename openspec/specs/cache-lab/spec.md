# cache-lab Specification

## Purpose

Lets students send a support ticket message through the UI and observe which cache cascade path answered: exact, semantic, or AI provider.

## Requirements

### Requirement: Submit ticket message for analysis
The Lab SHALL allow the user to submit a non-empty message to `POST /tickets/analyze` and display the analysis result returned by the API.

#### Scenario: Successful analysis
- **WHEN** the user submits a valid message and the API returns success
- **THEN** the Lab shows the `result` fields and request telemetry from the response

#### Scenario: Empty message rejected
- **WHEN** the user attempts to submit an empty or whitespace-only message
- **THEN** the Lab does not call the API and shows a validation message

#### Scenario: API error
- **WHEN** the analyze request fails
- **THEN** the Lab shows an error state and does not invent a fake cascade path

### Requirement: Cascade timeline reflects response source
The Lab SHALL visualize the cascade path using the response fields `source`, `cache`, `semantic_cache`, and `semantic_cache_write` so the user can see which stage answered.

#### Scenario: Exact cache hit
- **WHEN** the API returns `source` equal to `exact_cache`
- **THEN** the timeline highlights the exact-cache stage as the answering path and indicates semantic evaluation and AI were not used for the answer

#### Scenario: Semantic cache hit
- **WHEN** the API returns `source` equal to `semantic_cache`
- **THEN** the timeline highlights the semantic-cache stage and shows similarity/threshold information when present in the response

#### Scenario: AI model path
- **WHEN** the API returns `source` equal to `ai_model`
- **THEN** the timeline highlights the AI stage and shows whether semantic cache write was attempted/saved when present in the response

### Requirement: Timing and AI call telemetry visible
The Lab SHALL display `elapsed_ms` and `ai_call_number` from the analyze response.

#### Scenario: Telemetry shown after success
- **WHEN** a successful analyze response is received
- **THEN** elapsed time and AI call number are visible in the Lab UI

### Requirement: Threshold readable for study
The Lab SHALL allow the user to read the current `semantic_cache_threshold` from `GET /config` (and MAY allow update via `PUT /config` within the API validation rules).

#### Scenario: View current threshold
- **WHEN** the user opens the Lab config controls
- **THEN** the current semantic cache threshold from the API is displayed
