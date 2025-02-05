export class User {
  constructor(reqBody) {
    this.userDetails = {
      email: reqBody.username,
      password: reqBody.password,
      role: 'customer',
    };
    this.createdDate = new Date();
    this.lastUpdatedDate = new Date();
  }
}
