import cors from 'cors';

const origin = [
  'http://localhost:80',
  'http://localhost:5173',
  'http://localhost:5374',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONT_WEB_APP_ORIGIN_URL];

const corsOptions = {
  origin: origin,
  // origin: true, // "true" will allow any origin //* For Debugging
  optionsSuccessStatus: 200,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
