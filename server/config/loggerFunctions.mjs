import { logger } from "./logger.mjs";

/*
Example Log Structure:
{
    timestamp: "YYYY-MM-DDTHH:mm:ss.sssZ",
    level: "info" | "warn" | "error" | "fatal",
    message: "Descriptive message",
    context: {
        userId: "Optional user ID",
        loginMethod: "Optional login method",
        error: "Optional error object",
        userData: "Optional user data",
        additionalInfo: "Any other relevant information"
    }
}

*/


export const logUserLoggedInSuccessfully = (userId, loginMethod) => {
    logger.info({
        message: `User logged in successfully`,
        context: {
            userId: userId,
            loginMethod: loginMethod,
            additionalInfo: `n/a`
        }
    });
};

//? Do we need to log this? It provides no actionable information? only "user does not exist?"

export const logFailedLoginUserDoesNotExist = (errorMessage) => {
    
    logger.warn({
        message: `Login attempt failed`,
        error: errorMessage, //* Logging the error message generated in passportJS
    });
};

export const logUserCreatedInDB = (userId, user) => {
    logger.info({
        message: `User succesfully created in database`,
        context: {
            userData: {
                userId: userId,
                email: user.userDetails.email,
                password: user.userDetails.password,
                role: user.userDetails.role,
            },
        }
    });
};

export const logUserLoggedOut = (userId) => {
    logger.info({
        message: `User logged out successfully`,
        context: {
            userId: userId,
        }
    });
};

export const logErrorInUserLogin = (error) => {
    logger.fatal({
        message: `Failed login attempt - Error logging in`,
        context: {
            error: error,
        }
    });
};

export const logMongoDbConnectionError = (error) => {
    logger.fatal({
        message: `[DB CONNECTION] Can't connect to MongoDB - ${error.errmsg}`,
        context: {
            error: error,
        }
    })
};