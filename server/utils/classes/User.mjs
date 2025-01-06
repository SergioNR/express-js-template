export class User {
    constructor(req) {
        this.userDetails = {
            email: req.body.userEmail.toLowerCase(),
            password: req.body.userPassword,
            role: `customer`,
        }
        this.createdDate = new Date();
        this.lastUpdatedDate = new Date();
        }
    };