# JukeboxFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

> **Note:** The app calls the backend through relative `/api/...` URLs. `ng serve`
> proxies `/api` to `http://localhost:5035` (see `proxy.conf.json`), so run the
> REST host locally first. In production, nginx does the same job.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running with Docker

```bash
docker build -t jukebox-frontend .
docker run --rm -p 8080:80 jukebox-frontend
```

Then open `http://localhost:8080`. `API_UPSTREAM` is the backend that nginx proxies `/api/` to (no trailing slash). It defaults to `http://host.docker.internal:5035`, which reaches a backend running on your host machine under Docker Desktop. Override it with `-e API_UPSTREAM=<url>` to point elsewhere.

On Linux, `host.docker.internal` is not defined by default, so add `--add-host=host.docker.internal:host-gateway` to the `docker run` command.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Deploying to Kubernetes (local dev)

These steps target a local cluster (kind) and were verified end to end. Production on Azure will differ: images will come from Azure Container Registry with AKS managed identity, so no pull secret or personal token will be needed.

### Prerequisites

- A running cluster with `kubectl` and `helm` configured
- The Jukebox Data Manager REST service deployed in the same namespace

### One-time setup: GHCR pull secret

The frontend image is published as a **private** GHCR package, so the cluster needs credentials to pull it.

1. Create a GitHub **classic** personal access token with the `read:packages` scope. Fine-grained tokens don't support GHCR. Prefer a token limited to that scope.
2. Create the secret in the namespace you're deploying to:

   ```powershell
   $pat = Read-Host "GitHub PAT"
   kubectl create secret docker-registry ghcr-pull `
     --docker-server=ghcr.io `
     --docker-username=<github-username> `
     --docker-password=$pat
   ```

The secret is namespace-scoped. Never commit the token or a secret manifest. Classic tokens expire: when yours does, new pods fail to pull, so delete and recreate the secret (`kubectl delete secret ghcr-pull`, then rerun the command above).

### Install

Find the REST service name with `kubectl get svc`. With a data-manager release named `jukebox`, it is `jukebox-jukebox-data-manager-rest`. Then:

```powershell
helm install jukebox-frontend ./charts/jukebox-frontend `
  --set image.tag=<version> `
  --set env.API_UPSTREAM=http://<rest-service-name>:5035 `
  --set "imagePullSecrets[0].name=ghcr-pull"
```

- `<version>` is a tag published by CI (for example `0.3.0-beta.20261002185727`).
- `API_UPSTREAM` must **not** end with a trailing slash.
- Use `helm upgrade` with the same flags to change versions.

### How API calls work

The Angular app calls relative `/api/...` URLs. nginx proxies `/api/` to `API_UPSTREAM` and forwards the path unchanged, so the browser never talks to the backend directly and CORS is not needed. `API_UPSTREAM` is injected into the nginx config at container start (`envsubst` on `/etc/nginx/templates/default.conf.template`). A plain `docker run` defaults it to `http://host.docker.internal:5035`; in Kubernetes the chart's `env.API_UPSTREAM` value overrides it.

### Access

kind does not publish NodePorts to the host, so use port-forward:

```powershell
kubectl port-forward svc/jukebox-frontend 8080:80
```

Then open http://localhost:8080 or check the API path with `curl.exe http://localhost:8080/api/artists`.

### Troubleshooting

- `ErrImagePull` with `401 Unauthorized`: the pull secret is missing, expired, lacks `read:packages`, or isn't referenced via `imagePullSecrets`.
- `host not found in upstream` in the pod logs: `API_UPSTREAM` doesn't match the REST Service name (`kubectl get svc`).
- `502` from `/api/...`: the REST service isn't reachable from the pod. Check that the REST pod is running.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.