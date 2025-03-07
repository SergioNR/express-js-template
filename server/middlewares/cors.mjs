import cors from 'cors';

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
