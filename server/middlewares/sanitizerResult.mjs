import { validationResult } from 'express-validator';

export const sanitizerResult = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        console.log(result.errors);
        return res.render('register.ejs', { message: result.errors });
    }
    next();
}