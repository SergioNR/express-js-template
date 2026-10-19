import cors from 'cors';

const origins = [
  process.env.FRONT_WEB_APP_ORIGIN_URL,
  'http://localhost:5173', // Vite dev server (from logs)
  'http://localhost:3000', // Common React dev server
  'http://localhost:8080', // Common dev ports
];

const corsOptions = {
  origin: origins,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
