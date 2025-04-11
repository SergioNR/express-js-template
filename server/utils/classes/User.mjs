export class User {
  constructor(reqBody) {
    this.userDetails = {
      email: reqBody.username,
      password: reqBody.password,
    };
  }
}
