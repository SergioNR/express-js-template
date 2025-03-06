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

ENV POSTHOG_API_KEY=phx_ShnvcRWX1166VeKHh5yD942PFT2txqH7VTCNvd2lwBIufkh

ENV SESSION_SECRET=TBD

ENV BREVO_API_KEY=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

ENV PINOJS_SOURCE_TOKEN=TBD

ENV NODE_ENV=localhost

ENV PRISMA_POSTGRES_CONNECTION_STRING=postgresql://prisma.uyowasnundxrxojgotne:Ya9Tgn7383o9@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true

ENV PRISMA_POSTGRES_CONNECTION_DIRECT_URL=postgresql://prisma.uyowasnundxrxojgotne:Ya9Tgn7383o9@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

ENV MONGODB_USERNAME=mongodblogs
ENV MONGODB_PASSWORD=kXgAXOmauqFX2nRy
ENV MONGODB_URI=localhost-cluster.rve78.mongodb.net
ENV MONGODB_CONNECTIONSTRING=mongodb+srv://mongodblogs:kXgAXOmauqFX2nRy@localhost-cluster.rve78.mongodb.net/?retryWrites=true&w=majority&appName=localhost-cluster

ENV TELEGRAM_BOT_API_KEY=7753554626:AAHlrI6FVVBGS_57as7gluPvkeq28AR1eME
ENV TELEGRAM_BOT_FLIGHTDEALS_CHAT_ID=-1002421875839
ENV TELEGRAM_BOT_LOGS_CHAT_ID=-4614017830


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

# Run Prisma generate
RUN npx prisma generate

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["npm", "run", "deploy:prod"]
