import { Router } from 'express';

export const indexRouter = Router();

indexRouter.get('*fallback', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested route is not available',
  });
});
