# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - Unreleased

### Added
- Helm chart for deploying the frontend to Kubernetes (`charts/jukebox-frontend`), with a NodePort service, readiness/liveness probes, and a configurable `API_UPSTREAM` value
- nginx reverse proxy that forwards `/api/` requests to the backend REST host, so the Angular app can use relative URLs and the browser needs no CORS
- Optional `imagePullSecrets` support in the Helm chart for private GHCR images
- README sections documenting Docker and Kubernetes deployment, including GHCR pull secret setup (local dev)

### Changed
- nginx config is now an `envsubst` template (`/etc/nginx/templates/default.conf.template`), and the Dockerfile sets a default `API_UPSTREAM` for plain `docker run`
- Quoted the fingerprinted-asset regex in `nginx.conf` for parser safety

## [0.2.0] - 2026-10-01

### Added
- CircleCI pipeline for build, test, coverage, SonarCloud scan, and GHCR image publish
- Dockerfile and nginx configuration for containerized deployment

### Fixed
- Missing prev-btn/next-btn classes on pagination buttons

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
