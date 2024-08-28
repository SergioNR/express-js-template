export class CustomUserExistsError extends Error {
    constructor() {
        super();
        this.statusCode = 409;
        this.message = `CustomerUserExistsError: User already exists so cant create it`;
    };
};