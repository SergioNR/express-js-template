export class User {
  constructor(reqBody) {
    this.userDetails = {
      email: reqBody.username,
      password: reqBody.password,
    };
    this.createdDate = new Date();
    this.lastUpdatedDate = new Date();
  }
}
