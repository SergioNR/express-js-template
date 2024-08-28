export class CustomUserNotFoundError extends Error {
    constructor() {
        super();
        this.name = `CustomNotFoundError`,
        this.statusCode = 404;
        this.message = `CustomUserNotFoundError: User not found`;
    };
};