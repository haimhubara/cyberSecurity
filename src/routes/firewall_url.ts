import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// Helper function to validate URLs
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// READ
router.get("/url", async (req: Request, res: Response) => {
  const { id, category } = req.query;

  try {
    let result;
    if (id) {
      result = await pool.query("SELECT * FROM firewall_urls WHERE id=$1", [id]);
    } else if (category) {
      result = await pool.query("SELECT * FROM firewall_urls WHERE category=$1", [category]);
    } else {
      result = await pool.query("SELECT * FROM firewall_urls");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// CREATE
router.post("/url", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  if (!values.every(v => typeof v === "string" && isValidUrl(v))) {
    return res.status(400).send("All values must be valid URLs");
  }

  try {
    const insertedValues = [];
    for (const url of values) {
      const result = await pool.query(
        "INSERT INTO firewall_urls (category, url) VALUES ($1, $2) RETURNING url",
        [mode, url]
      );
      insertedValues.push(result.rows[0].url);
    }

    res.status(201).json({
      type: "url",
      mode,
      values: insertedValues,
      status: "success"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// UPDATE
router.put("/url", async (req: Request, res: Response) => {
  const { id, category, url } = req.body;
  if (!id || !category || !url) return res.status(400).send("id, category and url are required");

  if (!isValidUrl(url)) {
    return res.status(400).send("Invalid URL");
  }

  try {
    const result = await pool.query(
      "UPDATE firewall_urls SET category=$1, url=$2 WHERE id=$3 RETURNING *",
      [category, url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// DELETE
router.delete("/url", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  try {
    await pool.query(
      `DELETE FROM firewall_urls WHERE url = ANY($1) AND category = $2`,
      [values, mode]
    );

    res.json({
      type: "url",
      mode,
      values,
      status: "success"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

export default router;
