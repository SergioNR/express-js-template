import session from "express-session";
import MongoStore from "connect-mongo";

export const storeSessionsInMongoDb = session({ 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 7200000, // 2 hours
        secure: process.env.NODE_ENV === 'production', // Secure in production
        httpOnly: true,
        sameSite: 'strict'
    }, 
    store: MongoStore.create({  //* SHOULD ONLY BE USED IN PROD - IN DEV WE SHOULD USE IN-MEMORY STORE OR DEV DB
        mongoUrl: process.env.MONGODB_CONNECTIONSTRING, 
        dbName: "main", 
        collectionName: "sessions",
        ttl: 7200, // 2 hours in seconds
        autoRemove: 'interval',
        autoRemoveInterval: 10 // Minutes between cleanup
    })
});

