import session from "express-session";
import  connectMongoDBSession  from "connect-mongodb-session";

const MongoDBStore = connectMongoDBSession(session);


const mongoDBSessionStore = new MongoDBStore({
    uri: process.env.MONGODB_CONNECTIONSTRING,
    databaseName: "main",
    collection: "sessions"
});


export const storeSessionsInMongoDb = session({ 
        secret: process.env.SESSION_SECRET,
        resave: false, // https://www.npmjs.com/package/express-session#resave - Set to false because `touch` is implemented
        saveUninitialized: false, // https://www.npmjs.com/package/express-session#saveuninitialized - Set to false because we'll only save sessions with req.session data (eg: logins, storing relevant info that we want to keep)
        cookie: { 
            maxAge: 7200000, // 2 hours
            secure: process.env.NODE_ENV === 'production', // Secure in production
            httpOnly: true,
            sameSite: 'strict'
        }, 
        store: mongoDBSessionStore,
    });
