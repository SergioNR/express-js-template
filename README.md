# express-js-template

# Description

This is a template for an Express.js application. It includes a basic setup for a REST API with a user model and authentication.

This template uses .ejs for the front end

# Features

- Analytics (Posthog)
- User Authentication (PassportJS)
- Database (MongoDB)
- Payments (Stripe)
- Logging (Pinojs)

# Code stuff

- testing - Playwright?


# Analytics

Product Analytics

- Front end
 - Posthog
 - Google Analytics
 - Google Tag Manager
 - Openreplay

- Back end
    - Posthog

# Logging & Visualizing logs

Logging is done with Pinojs --> https://www.npmjs.com/package/pino

Visualizing logs is done with BetterStack --> 

## Set up

- Create a new project on BetterStack
- Obtain as many API keys as needed (eg: PROD, DEV, etc) from https://telemetry.betterstack.com/team/304340/sources by creating new sources
- Add the API keys to the .env file

Bear in mind that we are using the pinojs logger in 3 scenarios:

- PROD --> Requires API key
- DEV --> Requires API key
- Localhost


# Deployment

- Recomended is Koyeb - Has a free instance

# Database

Create a mongoDB database and add the username & password & connection string to the .env file