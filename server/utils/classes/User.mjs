import crypto from 'crypto';

export class User {
  constructor(reqBody) {
    this.id = crypto.randomUUID();
    this.userDetails = {
      email: reqBody.username,
      password: reqBody.password,
      role: 'customer',
    };
    this.createdDate = new Date();
    this.lastUpdatedDate = new Date();
  }
}
