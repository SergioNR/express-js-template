# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=22.14.0

FROM node:${NODE_VERSION}-alpine


# Use production node environment by default.
ENV NODE_ENV=production

# Declare env variables
ENV PORT=3000

# Install PostgreSQL client for pg_isready
RUN apk add --no-cache postgresql-client

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

# Run the application.

CMD ["./start.sh"]