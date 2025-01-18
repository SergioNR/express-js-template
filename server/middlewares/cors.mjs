import cors from 'cors';

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);
