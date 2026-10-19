# Use the latest Docker syntax parser
# syntax=docker/dockerfile:1

# Define build arguments for environment variables
ARG NODE_VERSION=24.11.1

# First stage: Build the application
FROM node:${NODE_VERSION}-alpine AS build

# Set the baseUrl ARG in the build stage to compile it - Will be replaced by docker build command
ARG VITE_API_BASE_URL
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_SITE_BASE_URL

# Set working directory for all build stages.
WORKDIR /usr/src/app

COPY package.json package-lock.json ./


RUN npm install


# Copy the rest of the source files into the image.
COPY . .

# Run the build script.
RUN npm run build

# SET NODE_ENV to production
ENV NODE_ENV=production

# Create a new stage for the production image
FROM nginx:1.27.4-alpine

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose the port
EXPOSE 80

# Nginx starts automatically, no need for CMD
