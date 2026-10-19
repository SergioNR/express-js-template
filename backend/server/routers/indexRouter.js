import { Router } from 'express';

export const indexRouter = Router();

indexRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'server is healthy',
  });
});

indexRouter.get('/*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
