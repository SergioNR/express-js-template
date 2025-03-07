import express from 'express';
import passport from 'passport';
import { cookieParserMiddleware } from './middlewares/cookieParser.mjs';
import { corsMiddleware } from './middlewares/cors.mjs';
import { helmetMiddleware } from './middlewares/helmet.mjs';
import { apiRouter } from './API/apiRouter.mjs';
import { storeSessions } from './middlewares/storeExpressSessions.mjs';
import { indexRouter } from './routers/indexRouter.mjs';

const app = express();

//* Middleware for ExpressJS securization
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParserMiddleware);

//* Middleware to create parse request (read req.body from form data & JSON) & parse query
app.use(express.urlencoded());
app.use(express.json());

//* Middleware to store sessions in DB
app.use(storeSessions);

app.use(passport.session());

//* Router selectors

app.use('/api/', apiRouter);
app.use('/', indexRouter);

//* Middleware to catch & handle errors
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).send(err.message);

  next();
});

//* Start the server
app.listen(process.env.PORT, () => {
// eslint-disable-next-line no-console
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});
