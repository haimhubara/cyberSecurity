import { Pool } from "pg";
import config from "./env";
import logger from "./logger";

export const pool = new Pool({
  connectionString: config.databaseUri,
});

let attempt = 0;


async function connectWithRetry() {
  try {
    await pool.query("SELECT 1");
    logger.info("Connected to database successfully!");
     attempt = 0; // reset counter
  } catch (err) {
    attempt++;
    const delay = Math.min(
      config.dbConnectionInterval * 2 ** (attempt - 1),
      30000 // cap at 30 seconds
    );
    logger.error(`DB connection failed: ${err}`);
    logger.info(`Retrying in ${config.dbConnectionInterval}ms...`);

    setTimeout(connectWithRetry,  config.dbConnectionInterval);
  }
}

connectWithRetry();


export default pool;
