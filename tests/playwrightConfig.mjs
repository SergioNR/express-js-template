import { defineConfig } from 'playwright/test';

let playwrightConfig = {};

switch (process.env.NODE_ENV) {
  case 'production':
    playwrightConfig = ({
      use: {
        baseURL: 'https://prod.localhost:3000',
      },
    });
    break;
  case 'development':
    playwrightConfig = ({
      use: {
        baseURL: 'https://dev.localhost:3000',
      },
    });
    break;
  default:
    playwrightConfig = ({
      use: {
        baseURL: 'http://localhost:3000',
      },
    });
    break;
}

export default defineConfig(playwrightConfig);
