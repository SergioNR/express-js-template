import session from "express-session";
import MongoStore from "connect-mongo";

export const storeSessionsInMongoDb = session({ 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 }, // 24 hours
    store: MongoStore.create({  //* SHOULD ONLY BE USED IN PROD - IN DEV WE SHOULD USE IN-MEMORY STORE OR DEV DB
        mongoUrl: process.env.MONGODB_CONNECTIONSTRING, 
        dbName: "main", 
        collectionName: "sessions" 
    })
});

