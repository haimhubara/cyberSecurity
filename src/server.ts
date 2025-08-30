import app from "./app";
import config from "./config/env"; 
import pool from "./config/db";
import logger from "./config/logger";

const PORT = config.port;

app.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);

  try {
    const result = await pool.query("SELECT current_database();");
    logger.info(`Connected to database: ${result.rows[0].current_database}`);
  } catch (err) {
    if (err instanceof Error) {
      logger.error(`Error checking database: ${err.message}\n${err.stack}`);
    } else {
      logger.error(`Error checking database: ${err}`);
    }
  }
});
