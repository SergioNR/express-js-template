# syntax=docker/dockerfile:1

# Define a build argument for Node.js version (pinned to a minor so backend
# and frontend images move together - see frontend/Dockerfile)
ARG NODE_VERSION=26.12

# Use official Node.js Alpine Linux image with the specified version
FROM node:${NODE_VERSION}-alpine

# Production mode for every library that checks NODE_ENV (express, etc.)
ENV NODE_ENV=production

# tini reaps zombies and forwards signals to node (PID 1 duties node does not do)
RUN apk add --no-cache tini

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install production dependencies only (prisma CLI + tsx are runtime
# dependencies: start.sh runs `prisma migrate deploy` and the server runs via tsx)
# Uses bind mounts for the files and a cache mount for npm
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy Prisma schema and CLI config files into the container
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma client with npm cache mount. No database URL is needed here:
# prisma.config.ts falls back to a placeholder when PRISMA_POSTGRES_DIRECT_URL is unset
RUN --mount=type=cache,target=/root/.npm npx prisma generate

# Copy all remaining source files into the container
COPY . .

# Copy and make executable the production startup script
COPY start.sh .
RUN chmod +x start.sh

# Switch to non-root user for better security
USER node

# Declare that the container will listen on port 3000
EXPOSE 3000

# Readiness probe against /health (server up + database answering). Uses the
# bundled node runtime - alpine ships neither curl nor a TLS-capable wget.
# start_period covers `prisma migrate deploy` on boot
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# tini as PID 1 so SIGTERM reaches node and gracefulShutdown runs
ENTRYPOINT ["/sbin/tini", "--"]

# Set the default command to run the production startup script
CMD ["./start.sh"]
