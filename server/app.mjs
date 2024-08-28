import express from "express";
import path  from "node:path";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import { userRouter } from "./routers/userRouter.mjs";
import { passportAuth, passportLogout } from "./middlewares/passportLocalStrategy.mjs";
import { apiRouter } from "./API/apiRouter.mjs";


export const app = express();

//* Set the views directory to the views folder
app.set(`views`, path.join(`.`, `/views/`)); 

//* Set the view engine to EJS
app.set("view engine", "ejs"); 

//* Middleware to serve static files
app.use(express.static(`./public`, { "extensions": [`html`] })); // add .html if they dont include it in the request


  //* Authentication middleware
  app.use(session({ 
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 86400 * 1000 * 365 },
  store: MongoStore.create({  //* SHOULD ONLY BE USED IN PROD - IN DEV WE SHOULD USE IN-MEMORY STORE
    mongoUrl: process.env.MONGODB_CONNECTIONSTRING, 
    dbName: "sessions", 
    collectionName: "sessions" 
  })
}));

app.use(passport.session());

//* Middleware to catch & handle errors
app.use((err, req, res, next) => {
  res.status(err.statusCode ||  500).send(err.message);
});

//* Middleware to create parse request (read req.body from form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//* Route to authenticate the user with passport    
app.post("/login", passportAuth); 
app.get("/logout", passportLogout);

//* Router selectors
app.use(`/user`, userRouter);
app.use(`/api/`, apiRouter)

//* Router to handle non-recognised requests
app.get(`*`, (req, res) => { 
  res.status(404).sendFile(`./public/404.html`, { root: `.` });
})


//* Start the server
app.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}/`);
});