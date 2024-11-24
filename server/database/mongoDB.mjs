import { MongoClient, ServerApiVersion } from "mongodb";
import { logger } from "../config/logger.mjs";

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}/?retryWrites=true`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let dbConnection;

export const connectToDatabase = async () => {
  if (dbConnection) {
    
    return dbConnection;

  } else {

      try {
        await client.connect();

        dbConnection = client.db("main");
        
        return dbConnection;

      } catch (error) {

        logger.fatal({
          message: `[DB CONNECTION] Cant connect to MongoDB - ${error.errmsg}`,
          error: error,
        })
        
        return error;
      }
    }
};
