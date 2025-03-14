# syntax=docker/dockerfile:1

# Set the base image to use for subsequent instructions.
ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine

# Create a directory for the app and set it as the working directory.
WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/root/.npm \
    npm ci 

# Copy Prisma schema files
COPY prisma ./prisma/

# Run Prisma generate to ready the Prisma client
RUN npx prisma generate

# Copy the rest of the source files into the image.
COPY . .

# Create a startup script
COPY start.sh .
RUN chmod +x start.sh

# # Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application. - Running from the start.sh instead of CMD ["npm run start"] script since we need to run "npx prisma deploy" before starting the server to sync the database schema.

CMD ["./start.sh"]
