# express-js-template

## Overview

This is a template for an ExpressJS server. It includes a project agnostic setup that will allow you to focus on business-related programming

This template is the backend part of a P/MERN template - paired with [ReactJs Template](https://github.com/SergioNR/reactJS-Template)

## Table of contents

- [Overview](#overview)
- [Getting started](#getting-started)
- [Features](#features)
  - [User analytics](#analytics)
  - [PrismaORM Database](#prismaORM)
  - [Security](#security)
  - [Payment processing](#payment-processing)
  - [Authentication & Authorization](#authentication-authorization)
  - [Logging](#logging)
  - [Extensive Test Coverage](#test-coverage)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

#### Node.js

- [NodeJS](https://nodejs.org/en/download) - This template is designed to work with `node version 22.14.0`

#### Docker & Docker Compose

We use `docker compose` from [Docker](https://www.docker.com/) to setup the services for development environment.

- For MacOS: Grab the docker mac installation from the [Docker website](https://www.docker.com/products/docker-desktop)

### Installation

#### npm and Node.js dependencies

Install dependencies:

```shell
npm install
```

### Running Locally

#### Set up environment variables

We use Node's inbuilt env variables injection via `process.env.VARIABLE_NAME` syntax

Copy the `.env.example` file and configure each variable

#### Start Docker services

If you installed Docker Desktop (on a Mac or Windows machine), you can run the following command to start the Docker services:

```shell
npm run start:docker
```

This will run `docker compose up --build --watch` which will start the backend and the PostgreSQL database

Note: for practicality, the database credentials for the local environment are hardcoded in the `compose.yaml` file

The application will now be reachable on [http://localhost:3000](http://localhost:3000)

## User Analytics

This template uses [Posthog Node](https://posthog.com/) for comprehensive user analytics

## Logging

We use [Pinojs](https://www.npmjs.com/package/pino) for logging which uses transports to record logs - Currently configured transports are:

- [Betterstack](https://betterstack.com/)
- [MongoDB](https://www.mongodb.com/)

## Log Visualization

  This template uses [Betterstack](https://betterstack.com/) to visualize logs - Modify as required

## Recommended third-party tools

- PostgreSQL Database
  - This template is using [Supabase free tier](https://supabase.com/pricing) to host a free PostgreSQL database. This can be enough for a dev env workload but production workload will require updatingw
- Koyeb Deployment
  - This template is using [Koyeb](https://koyeb.com) for deployments - Its pretty affordable and has autoscaling to 0 to save costs

## Security

### Request slowing & limiting

To guarantee API resilence and provide protection against attacks, the following has been implemented

- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
  - Helps with brute force attacks, DDoS, Scraping & API abuse
- [express-slow-down](https://www.npmjs.com/package/express-slow-down)
  - Gives the server breathing room under heavy load
