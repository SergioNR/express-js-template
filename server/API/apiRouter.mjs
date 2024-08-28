import { Router } from 'express';
import { stripeWebhook } from './v1/webhooks/stripeWebhooks.mjs';
import { userApi } from './v1/userApiController.mjs';

export const apiRouter = Router();


apiRouter.post(`/v1/test/webhooks/stripeWebhooks`, stripeWebhook);
apiRouter.use(`/v1/user`, userApi);


apiRouter.use(`*`, (req, res) => {
    res.status(404).send(`Route not found in apiRouter`);
});