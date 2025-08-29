import { Pool } from "pg";
import config from "./env";

export const pool = new Pool({
  connectionString: config.databaseUri,
});

export default pool;
