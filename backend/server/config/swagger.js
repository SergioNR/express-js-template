import swaggerJsdoc from 'swagger-jsdoc';
import { SESSION_COOKIE_NAME } from './security.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Express.js Template API',
      description: 'REST API for the Express.js server template. Interactive documentation is generated from `@openapi` JSDoc annotations declared next to each route definition.',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Auth', description: 'Authentication and password management' },
      { name: 'User', description: 'Logged-in user profile management' },
      { name: 'Team', description: 'Company team and invite management' },
      { name: 'Billing', description: 'Stripe subscription billing' },
      { name: 'Admin', description: 'Admin-only user management' },
      { name: 'Webhooks', description: 'Inbound third-party webhooks' },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: SESSION_COOKIE_NAME,
          description: 'Session cookie issued by POST /api/v1/auth/login. Authentication is passive — a valid cookie must be present on requests to secured endpoints.',
        },
      },
      schemas: {
        SuccessMessage: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            message: {
              type: 'string',
              description: 'Optional developer-facing text - present only when it adds information beyond the status and payload',
            },
          },
        },
        ErrorMessage: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Optional developer-facing text - present only when it adds information beyond the status and payload (conflict reasons, token expiry, rate limiting, route-404 fallback)',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  msg: { type: 'string' },
                  path: { type: 'string' },
                  location: { type: 'string' },
                },
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              format: 'email',
              description: 'The user email (the field is historically named username)',
            },
            password: {
              type: 'string',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              format: 'email',
              description: 'The user email (the field is historically named username)',
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 64,
            },
          },
        },
        PasswordResetRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
        RecoverPasswordRequest: {
          type: 'object',
          required: ['newPassword', 'confirmNewPassword', 'passwordResetToken'],
          properties: {
            newPassword: {
              type: 'string',
              minLength: 8,
              maxLength: 64,
            },
            confirmNewPassword: {
              type: 'string',
            },
            passwordResetToken: {
              type: 'string',
              format: 'uuid',
            },
          },
        },
        UpdatePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: {
              type: 'string',
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              maxLength: 64,
            },
          },
        },
        TeamInviteRequest: {
          type: 'object',
          required: ['email', 'roleName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              maxLength: 254,
            },
            roleName: {
              type: 'string',
              enum: ['company_owner', 'company_admin', 'company_member'],
              description: 'Company role the invitee will receive. The inviter must hold it themselves unless they are a global admin.',
            },
          },
        },
        UpdateMemberRoleRequest: {
          type: 'object',
          required: ['roleName'],
          properties: {
            roleName: {
              type: 'string',
              enum: ['company_owner', 'company_admin', 'company_member'],
            },
          },
        },
        AcceptInviteRequest: {
          type: 'object',
          required: ['inviteToken', 'password'],
          properties: {
            inviteToken: {
              type: 'string',
              format: 'uuid',
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 64,
            },
          },
        },
      },
    },
  },
  apis: [
    './server/routers/indexRouter.js',
    './server/API/v1/routes/*.js',
    './server/webhooks/webhooksRouter.js',
  ],
};

export const openapiSpecification = swaggerJsdoc(swaggerOptions);
