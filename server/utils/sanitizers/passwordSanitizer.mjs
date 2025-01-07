import { body } from 'express-validator';

export const passwordSanitizer = 
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .trim()
        .escape()
;