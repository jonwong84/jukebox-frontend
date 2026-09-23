# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-23

### Added
- Initial Angular 22 project scaffold using standalone components, Signals, and the esbuild/Vite application builder
- Vitest configured for unit testing
- `SongService` for retrieving song data from the Jukebox API, with full Vitest spec coverage
- Development proxy configuration (`proxy.conf.json`) so `ng serve` forwards `/api/**` requests to the local backend
- VS Code launch configuration for debugging Vitest tests

### Fixed
- Removed stale Karma-based test debug configuration from `.vscode/launch.json`, replaced with a working Vitest debug launch using the Angular CLI's `--debug` flag
- Removed unusable `ng e2e` instructions from `README.md`, since no end-to-end testing framework is configured yet