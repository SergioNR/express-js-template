import bcrypt from "bcryptjs";


export class User {
    constructor(req) {
        this.userDetails = {
            email: req.body.userEmail,
            password: req.body.userPassword,
            role: `customer`,
        }
        this.createdDate = new Date();
        this.lastUpdatedDate = new Date();
        }
    };