# web-shell Specification

## Purpose

Provides the Angular study portal shell: app layout, navigation, typed HTTP access to the Hono API, and environment health visibility for subsequent lab features.

## Requirements

### Requirement: Application shell is available
The system SHALL provide a single-page Angular application under `web/` that renders a persistent shell with brand/title, primary navigation, and a main content area for routed pages.

#### Scenario: User opens the portal
- **WHEN** the user navigates to the application root URL
- **THEN** the shell layout is visible with navigation and a main content region

#### Scenario: Navigation between placeholder routes
- **WHEN** the user selects a primary nav item (Lab, Cenários, Observabilidade, or Arquitetura)
- **THEN** the main content area updates to the corresponding route without a full page reload

### Requirement: Backend base URL is configurable
The system SHALL allow configuring the Hono API base URL used by HTTP calls (default suitable for local development, e.g. `http://localhost:8000`).

#### Scenario: Default local API URL
- **WHEN** the application starts with default configuration
- **THEN** HTTP requests target the local Hono base URL without hardcoding hostnames in feature components

### Requirement: Environment health is visible
The system SHALL display the reachability status of the backend using existing health endpoints (`GET /health` and/or `GET /db/status`).

#### Scenario: Backend is reachable
- **WHEN** the health request succeeds
- **THEN** the shell indicates a healthy/connected state

#### Scenario: Backend is unreachable
- **WHEN** the health request fails (network error or non-success status)
- **THEN** the shell indicates an unhealthy/disconnected state without crashing the application

### Requirement: Semantic HTML landmarks
The shell SHALL use semantic landmarks (`header`, `nav`, `main`) so assistive technologies can identify primary regions.

#### Scenario: Landmark structure
- **WHEN** the shell is rendered
- **THEN** the page exposes distinct header, navigation, and main landmarks
