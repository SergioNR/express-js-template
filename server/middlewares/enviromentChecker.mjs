export const environmentChecker = (req, res, next) => {
    
    res.locals.environment = process.env.NODE_ENV || `development`;

    next();
};

