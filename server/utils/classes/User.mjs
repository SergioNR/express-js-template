export class User {
    constructor(req) {
        this.userDetails = {
            email: req.body.username,
            password: req.body.password,
            role: `customer`,
        }
        this.createdDate = new Date();
        this.lastUpdatedDate = new Date();
        }
    };