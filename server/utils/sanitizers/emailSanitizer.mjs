import { body } from 'express-validator';

export const emailSanitizer = 
    body('userEmail')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail()
        .escape()
;
