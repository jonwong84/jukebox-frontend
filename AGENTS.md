# AGENTS.md — Jukebox Frontend Guidelines

## Project Overview
Jukebox Frontend is a modern Angular client application for the Jukebox platform, built with standalone components, Angular Signals, strict TypeScript, and Vitest.

---

## Tech Stack & Tooling
* **Framework:** Angular 22 (Standalone components, Zoneless/Signals-first, functional providers)
* **Language:** TypeScript 6.0+ (Strict mode)
* **HTTP Client:** `@angular/common/http` with `provideHttpClient()`
* **Unit Testing:** Vitest (`vitest`, `jsdom`, `@angular/platform-browser/testing`, `@angular/common/http/testing`)
* **Formatting:** Prettier

---

## Common Commands

### Development & Build
```bash
# Start local development server (http://localhost:4200)
npm start
# or
ng serve

# Build production bundle (output to dist/jukebox-frontend)
npm run build
# or
ng build

# Build with watch mode in development configuration
npm run watch
```

### Testing (Vitest)
```bash
# Run all unit tests once
npx vitest run

# Run with verbose test reporting
npx vitest run --reporter=verbose

# Run a specific spec file
npx vitest run src/app/services/song.service.spec.ts

# Run tests in watch mode
npx vitest
```

---

## Repository & Directory Structure
```
src/
├── app/
│   ├── models/                # TypeScript data contract interfaces & types
│   │   ├── song.model.ts      # Song, Artist, Album, Genre, PagedResult interfaces
│   │   └── index.ts           # Barrel export for models
│   ├── services/              # Injectable API and business logic services
│   │   ├── song.service.ts    # SongService interacting with /api/songs
│   │   ├── song.service.spec.ts
│   │   └── index.ts           # Barrel export for services
│   ├── app.config.ts          # Root ApplicationConfig & functional providers
│   ├── app.routes.ts          # Application routing definitions
│   ├── app.spec.ts            # Root App component unit test
│   └── app.ts                 # Root App standalone component
├── test-setup.ts              # Angular TestBed platform initialization for Vitest
├── main.ts                    # Application bootstrap entry point
└── styles.css                 # Global stylesheets
```

---

## Architecture & Code Conventions

### 1. Angular Standalone & Dependency Injection
* Always use **standalone components, directives, and pipes** (`imports: [...]`).
* Root services must be annotated with `@Injectable({ providedIn: 'root' })`.
* Prefer the functional `inject(...)` syntax over constructor injection:
  ```typescript
  export class SongService {
    private readonly http = inject(HttpClient);
  }
  ```
* Register global providers functionally in [`src/app/app.config.ts`](src/app/app.config.ts) using `provideHttpClient()`, `provideRouter()`, etc.

### 2. TypeScript & Data Models
* Maintain **strict typing** across all models and services; avoid `any`.
* Keep models in [`src/app/models/`](src/app/models/) and re-export them via `index.ts`.
* List endpoints return paginated wrappers matching `PagedResult<T>`:
  ```typescript
  export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
  }
  ```

### 3. Unit Testing with Vitest
* Explicitly import test primitives from `vitest`:
  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from 'vitest';
  ```
* Use functional testing providers (`provideHttpClient()` + `provideHttpClientTesting()`) rather than module-based imports:
  ```typescript
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      SongService,
    ],
  });
  ```
* Always verify pending mock HTTP requests in `afterEach`:
  ```typescript
  afterEach(() => {
    httpMock.verify();
  });
  ```

### 4. Async / Concurrent Request Handling

These conventions apply across all Jukebox repos, not just the frontend — they're general failure modes for anything that fetches data, runs jobs, or handles concurrent triggers.

* **Cancel or ignore superseded work.** When a new request/trigger supersedes an earlier one still in flight (a new search, a re-triggered reconciliation run, a repeated call), the earlier one's result must not be allowed to overwrite the later one's state. Use whatever cancellation mechanism fits the stack — e.g. RxJS `switchMap` in Angular, `CancellationToken`/`CancellationTokenSource` in .NET — but the guarantee is the same: only the most recent operation's result should ever land in state.
* **Consume pagination fully.** When consuming a paginated result set, don't just store the current page's items — retain total count and page state, and provide a way to reach data beyond the first page. Reset to the first page whenever the query/filter criteria changes.
* **Distinguish error state from empty/stale state.** A failed operation must be recorded as a distinct error state, never allowed to fall through to "no results" or leave stale prior data looking current. Clear the error state at the start of each new attempt.

Reference implementation: `jukebox-frontend`, `src/app/artists-list/artists-list.ts` — search + pagination + error handling via a `fetchTrigger$` → `switchMap` → inner `catchError` pipeline.

---

## Backend API Integration Reference
* **Backend Host:** `jukebox-data-manager` (REST API default: `http://localhost:5035`)
* **Key Routes:**
  * `GET /api/songs` — Paginated song list (accepts query parameters matching `SongFilters`)
  * `GET /api/songs/{id}` — Song details by ID
  * `GET /api/artists`, `GET /api/albums`, `GET /api/genres`
* **Auth Behavior:**
  * **Development:** Uses `DevBypassMiddleware` (`Auth:DevBypass: true`), automatically authenticating requests as `dev-user` without needing JWT tokens.
  * **Production:** Requires `Authorization: Bearer <jwt_token>`.

---

## Local Development Setup

To run the full stack locally with the `jukebox-data-manager` backend:

### 1. Start SQL Server
Run Docker Compose from the `jukebox-data-manager` repository root:
```bash
# In jukebox-data-manager/
docker compose up -d
```

### 2. Configure Environment Variables
Set the database connection string and development environment (enables `DevBypass` for auth):

**Windows (PowerShell):**
```powershell
$env:JUKEBOX_DB_CONNECTION_STRING = "Server=localhost,1433;Database=Jukebox;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;"
$env:ASPNETCORE_ENVIRONMENT = "Development"
```

**macOS / Linux (Bash):**
```bash
export JUKEBOX_DB_CONNECTION_STRING="Server=localhost,1433;Database=Jukebox;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True;"
export ASPNETCORE_ENVIRONMENT="Development"
```

### 3. Run the Backend REST Host
```bash
# In jukebox-data-manager/
dotnet run --project src/Hosts/Jukebox.DataManager.Rest
```
The REST API will be available at `http://localhost:5035`.


