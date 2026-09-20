# Spec Delta

## Purpose

Teaches the semantic-cache architecture through diagrams, layer explanations, and curated code references so students connect Lab behavior to real project structure.

## ADDED Requirements

### Requirement: Architecture overview page
The study portal SHALL provide an architecture page explaining the layers Application (Hono cache cascade), Proxy/Gateway (future LiteLLM), and Provider (e.g. Gemini), including that the platform is for study only.

#### Scenario: View architecture page
- **WHEN** the user opens the Arquitetura (or study portal) route
- **THEN** the three layers and their roles are described

### Requirement: Cascade flow explanation
The portal SHALL explain the exact → semantic → AI cascade and when each path writes or skips cache, consistent with the backend behavior.

#### Scenario: Cascade steps documented
- **WHEN** the user views the cascade section
- **THEN** exact hit, semantic hit, and AI miss paths are described including write-on-AI-only behavior

### Requirement: Curated code references
The portal SHALL present curated references to relevant backend areas (fingerprint, exact cache, semantic evaluate/save, classify) for study, without requiring the user to open the IDE.

#### Scenario: Code reference sections visible
- **WHEN** the user views the code/study section
- **THEN** named backend areas are listed with short explanations of responsibility

### Requirement: Glossary
The portal SHALL include a short glossary covering fingerprint, threshold, embedding, and `source`.

#### Scenario: Glossary terms
- **WHEN** the user opens the glossary
- **THEN** the terms fingerprint, threshold, embedding, and source are defined

### Requirement: Future proxy callout
The portal SHALL include a clear callout that LiteLLM proxy is a planned next study step (not required for Lab MVP).

#### Scenario: LiteLLM stub visible
- **WHEN** the user views the architecture layers
- **THEN** the proxy layer is marked as future/planned study work
