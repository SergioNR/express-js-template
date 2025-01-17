import cors from 'cors';

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}; // TODO -- PROPERLY DEFINE THE CORS OPTIONS

export const corsMiddleware = cors(corsOptions);