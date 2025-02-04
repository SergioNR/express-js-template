import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  // port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
  // connectionString: process.env.POSTGRES_CONNECTIONSTRING,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'localhost' ? false : true,
  // types?: any, // custom type parsers
  // statement_timeout?: number, // number of milliseconds before a statement in query will time out, default is no timeout
  // query_timeout?: number, // number of milliseconds before a query call will timeout, default is no timeout
  // lock_timeout?: number, // number of milliseconds a query is allowed to be en lock state before it's cancelled due to lock timeout
  // application_name?: string, // The name of the application that created this Client instance
  // connectionTimeoutMillis?: number, // number of milliseconds to wait for connection, default is no timeout
  // idle_in_transaction_session_timeout?: number,
});
