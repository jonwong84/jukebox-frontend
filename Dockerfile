# ---- Stage 1: build the Angular app ----
# Node 22.22.3+ required by this Angular CLI version (20-alpine was too old).
FROM node:22-alpine AS build

WORKDIR /app

# Copy only package files first so Docker can cache the npm install layer
# (this layer only re-runs when package.json/package-lock.json actually change)
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the rest of the source and build
COPY . .
RUN npm run build

# ---- Stage 2: serve the built static files with nginx ----
FROM nginx:1.27-alpine AS runtime

# Remove nginx's default static content
RUN rm -rf /usr/share/nginx/html/*

# Copy our SPA-aware nginx config as a *template*. The nginx image's entrypoint
# runs envsubst over /etc/nginx/templates/*.template at container start and
# writes the result to /etc/nginx/conf.d/ (default.conf.template -> default.conf),
# replacing the stock default.conf.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default upstream for standalone `docker run` on Docker Desktop, where
# host.docker.internal reaches the host machine. On Linux, add
# --add-host=host.docker.internal:host-gateway. Kubernetes overrides this
# via the chart's env block. Must NOT end with a trailing slash.
ENV API_UPSTREAM=http://host.docker.internal:5035

# Copy the compiled Angular output from the build stage.
# Confirmed via local `dir`: dist/jukebox-frontend contains a browser/ subfolder
# (plus 3rdpartylicenses.txt, prerendered-routes.json) — index.html lives in browser/.
COPY --from=build /app/dist/jukebox-frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]