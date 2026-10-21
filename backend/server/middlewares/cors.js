import cors from 'cors';
import { allowedOrigins } from '../config/allowedOrigins.js';

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
