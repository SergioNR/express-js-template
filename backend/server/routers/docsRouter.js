import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpecification } from '../config/swagger.js';

export const docsRouter = Router();

//* Interactive Swagger UI - served at /api/docs (assets served from /api/docs/*)
docsRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

//* Raw OpenAPI specification in JSON format - served at /api/docs.json
docsRouter.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(openapiSpecification);
});
