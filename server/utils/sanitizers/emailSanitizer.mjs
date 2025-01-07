import { body } from 'express-validator';

export const emailSanitizer = 
    body('username')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail()
        .escape()
;
