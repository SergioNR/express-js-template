# Use the latest Docker syntax parser
# syntax=docker/dockerfile:1

# Define a build argument for Node.js version, defaulting to 22.14.0
ARG NODE_VERSION=22.14.0

# Use official Node.js Alpine Linux image with the specified version
FROM node:${NODE_VERSION}-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install dependencies using package.json and package-lock.json
# Uses bind mounts for the files and a cache mount for npm
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy Prisma schema files into the container
COPY prisma ./prisma/

# Generate Prisma client with npm cache mount
RUN --mount=type=cache,target=/root/.npm npx prisma generate

# Copy all remaining source files into the container
COPY . .

# Copy and make executable the local startup script
COPY startLocal.sh .
RUN chmod +x startLocal.sh

# Copy and make executable the production startup script
COPY start.sh .
RUN chmod +x start.sh

# Switch to non-root user for better security
USER node

# Declare that the container will listen on port 3000
EXPOSE 3000

# Set the default command to run the local startup script
CMD ["./startLocal.sh"] 
