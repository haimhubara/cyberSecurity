import { Pool } from "pg";
import config from "./env";
import logger from "./logger";

export const pool = new Pool({
  connectionString: config.databaseUri,
});


async function connectWithRetry() {
  try {
    await pool.query("SELECT 1");
    logger.info("Connected to database successfully!");
  } catch (err) {
    logger.error(`DB connection failed: ${err}`);
   logger.info(`Retrying in ${config.dbConnectionInterval}ms...`);

    setTimeout(connectWithRetry,  config.dbConnectionInterval);
  }
}

connectWithRetry();


export default pool;
