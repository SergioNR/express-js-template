import express from "express";
import path  from "node:path";
import passport from "passport";
import { userRouter } from "./routers/userRouter.mjs";
import { passportAuth, passportLogout } from "./middlewares/passportLocalStrategy.mjs";
import { queryParser } from "./middlewares/queryParser.mjs";
import { helmetMiddleware } from "./middlewares/helmet.mjs";
// import { apiRouter } from "./API/apiRouter.mjs";
import { storeSessionsInMongoDb } from "./middlewares/mongoDbSessions.mjs";
import { environmentChecker } from "./middlewares/enviromentChecker.mjs";
import { indexRouter } from "./routers/indexRouter.mjs";

export const app = express();

//* Middleware for ExpressJS securization
app.use(helmetMiddleware);

//* Set the views directory to the views folder & view engine to EJS
app.set(`views`, path.join(`.`, `/server/views/`)); 
app.set("view engine", "ejs"); 

// * Middleware to serve static files
app.use(express.static(`./public`, { "extensions": [`html`] })); // add .html if they dont include it in the request

//* Middleware to create parse request (read req.body from form data & JSON) & parse query
app.use(express.urlencoded());
app.use(express.json());
app.use(environmentChecker); // https://app.clickup.com/t/86976mxym
// app.use(queryParser) //! FIX

//* Middleware to store sessions in MongoDB
app.use(storeSessionsInMongoDb);

app.use(passport.session());

//* Route to authenticate the user with passport    
app.get(`/register`, (req, res) => {
  res.sendFile(`./public/register.html`, { root: `.` });
})
app.post("/login", passportAuth); 
app.get("/logout", passportLogout);

//* Router selectors

app.use(`/user/`, userRouter);
app.use(`/`, indexRouter); //* Remember this should be in last position to avoid cannibalizing other routes
// app.use(`/api/`, apiRouter)

//* Router to handle non-recognised requests



//* Middleware to catch & handle errors
app.use((err, req, res, next) => {
  res.status(err.statusCode ||  500).send(err.message);
});


//* Start the server
app.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});