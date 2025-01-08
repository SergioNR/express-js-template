import { validationResult } from 'express-validator';

export const sanitizerResult = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {

        return res.render('register.ejs', { message: result.errors });
    }
    next();
}