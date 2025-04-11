import cors from 'cors';

const origin = [
  process.env.FRONT_WEB_APP_ORIGIN_URL,
  // ADD other origins as required
];

const corsOptions = {
  origin: origin,
  optionsSuccessStatus: 200,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
