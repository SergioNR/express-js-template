import { Router } from 'express';

export const indexRouter = Router();

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Returns whether the server is up and able to handle requests.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: server is healthy
 */
indexRouter.get('/', (req, res) => {
  res.status(200).json({
    message: 'server is healthy',
  });
});

indexRouter.get('/*fallback', (req, res) => {
  res.status(404).json({
    message: 'The requested route is not available or does not exist',
  }); //* Will catch failed requests even though they are authenticated & have the appropiate role
});
