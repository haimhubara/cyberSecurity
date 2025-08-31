import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import config from "./env";
import * as schema from "../drizzle/schema";

const MAX_ATTEMPTS = 5;

let sql: ReturnType<typeof postgres>;

async function connectWithRetry(attempt = 1) {
  try {
    sql = postgres(config.databaseUri, { max: 10, idle_timeout: 30 });
    await sql`SELECT 1`;
    console.log("Connected to database!");
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      console.warn(`Connection failed. Retrying in 2s... (Attempt ${attempt})`);
      await new Promise(res => setTimeout(res, 2000));
      await connectWithRetry(attempt + 1);
    } else {
      throw new Error("Could not connect to database after multiple attempts.");
    }
  }
}

await connectWithRetry(); 
export const db = drizzle(sql!, { schema });
export default db;
