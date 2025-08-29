import app from "./app";
import config from "./config/env"; 
import pool from "./config/db";

const PORT = config.port;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const result = await pool.query("SELECT current_database();");
    console.log("Connected to database:", result.rows[0].current_database);
  } catch (err) {
    console.error("Error checking database:", err);
  }
});
