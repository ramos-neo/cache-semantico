# Spec Delta

## Purpose

Introduces a LiteLLM-based proxy gateway for study so the application can call AI providers through an intermediate layer without changing the cache-cascade ownership in Hono.

## ADDED Requirements

### Requirement: LiteLLM proxy runnable locally
The system SHALL provide a documented local way to run LiteLLM (e.g. Docker Compose service) configured for the study environment.

#### Scenario: Start proxy service
- **WHEN** the operator follows the documented compose/start steps with required env vars
- **THEN** the LiteLLM proxy process/service is reachable on its configured local URL

### Requirement: Application can use proxy when enabled
When proxy mode is enabled via configuration/env, the Hono AI client path SHALL send provider requests through the LiteLLM base URL instead of calling the provider SDK endpoint directly.

#### Scenario: Proxy mode enabled
- **WHEN** `AI_PROXY` (or equivalent documented env) is enabled and LiteLLM is up
- **THEN** classify/embedding traffic is directed to the proxy base URL

#### Scenario: Proxy mode disabled
- **WHEN** proxy mode is disabled
- **THEN** the application keeps the existing direct Gemini SDK behavior for study continuity

### Requirement: Cache cascade remains in Hono
Enabling the proxy MUST NOT move exact or semantic cache decisions into LiteLLM; those remain in the Hono cascade.

#### Scenario: Analyze still returns cascade telemetry
- **WHEN** proxy mode is enabled and the user calls `POST /tickets/analyze`
- **THEN** the response still includes `source` / cache telemetry from the Hono cascade

### Requirement: Study documentation for layers
The change SHALL document the runtime topology UI → Hono → (optional LiteLLM) → Provider and how to toggle proxy mode.

#### Scenario: Docs describe toggle
- **WHEN** a reader opens the proxy study docs
- **THEN** enable/disable steps and ports/URLs are described
