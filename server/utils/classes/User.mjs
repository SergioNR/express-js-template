export class User {
    constructor(req) {
        this.userDetails = {
            email: req.body.userEmail,
            password: `not set`,
            role: `customer`,
        }
        this.createdDate = new Date();
        this.lastUpdatedDate = new Date();
        }
    };