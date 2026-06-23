# Changelog

All notable changes to Porchlight are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Layer architecture & reset** (`@cawalch/porchlight`). First framework CSS:
  every rule lives inside one top-level `@layer porchlight { … }` with nine
  deterministic sub-layers; a minimal `:where()`-based reset replaces any
  normalize.css dependency. Consumers override via `@layer porchlight, app;`.

## [0.0.0] - in development

Project scaffolding. Nothing is published; token names, class contracts, and
the layer structure are not yet stable.
