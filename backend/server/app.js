import express from 'express';
import passport from 'passport';
import { createServer } from 'http';
import { cookieParserMiddleware } from './middlewares/cookieParser.js';
import { corsMiddleware } from './middlewares/cors.js';
import { helmetMiddleware } from './middlewares/helmet.js';
import { apiRouter } from './API/apiRouter.js';
import { storeSessions } from './middlewares/storeExpressSessions.js';
import { indexRouter } from './routers/indexRouter.js';
import { docsRouter } from './routers/docsRouter.js';
import { limiter } from './middlewares/express-rate-limiter.js';
import { slowLimiter } from './middlewares/express-slow-down.js';
import { checkOrigin } from './middlewares/originChecker.js';
import { checkJsonContentType } from './middlewares/jsonContentTypeChecker.js';
import { startCronJobs } from './cron/jobsContainer.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { webhookRouter } from './webhooks/webhooksRouter.js';

const app = express();
const server = createServer(app);

//* Trust the reverse proxy so req.ip / req.protocol reflect the client
app.set('trust proxy', 1);

//* Middleware for ExpressJS securization
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParserMiddleware);
if (process.env.DEPLOY_ENVIRONMENT !== 'localhost') app.use(slowLimiter);
if (process.env.DEPLOY_ENVIRONMENT !== 'localhost') app.use(limiter);

//* Webhooks router
app.use('/webhooks', webhookRouter);

//* API documentation (Swagger UI + raw OpenAPI spec) - mounted before rate limiters
//* so the documentation static assets are not throttled in production
app.use('/api', docsRouter);

//* CSRF protection - state-changing requests must come from an allowed origin
app.use(checkOrigin());

//* Only JSON bodies are accepted on the API (no urlencoded/form parsing, so
//* cross-site HTML forms cannot submit to it)
app.use('/api', checkJsonContentType());
app.use(express.json());

//* Middleware to store sessions in DB
app.use(storeSessions);

app.use(passport.session());

//* Router selectors

app.use('/api/', apiRouter);
app.use('/', indexRouter);

//* Middleware to catch & handle errors
app.use(globalErrorHandler);

//* Start the server
const PORT = Number.parseInt(process.env.PORT, 10);

if (!Number.isInteger(PORT) || PORT <= 0) {
  // eslint-disable-next-line no-console
  console.warn('PORT environment variable is not set or invalid - defaulting to 3000');
}

server.listen(Number.isInteger(PORT) && PORT > 0 ? PORT : 3000, () => {
// eslint-disable-next-line no-console
  console.log('Server running');
});

startCronJobs();

const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server...');

  server.close(() => {
    console.log('Express server closed');
    // TODO - Close other resources (database connections, etc.)
    // ...
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
