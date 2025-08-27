import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

//READ
router.get("/ip", async (req: Request, res: Response) => {
  const { id, category } = req.query;

  try {
    let result;
    if (id) {
      result = await pool.query("SELECT * FROM firewall_ips WHERE id=$1", [id]);
    } else if (category) {
      result = await pool.query("SELECT * FROM firewall_ips WHERE category=$1", [category]);
    } else {
      result = await pool.query("SELECT * FROM firewall_ips");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//CREATE
router.post("/ip", async (req: Request, res: Response) => {
  const { values, mode } = req.body; 

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  try {
 
    const insertedValues = [];
    for (const ip of values) {
      const result = await pool.query(
        "INSERT INTO firewall_ips (category, ip) VALUES ($1, $2) RETURNING ip",
        [mode, ip]
      );
      insertedValues.push(result.rows[0].ip);
    }

    res.status(201).json({
      type: "ip",
      mode,
      values: insertedValues,
      status: "success"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//UPDATE
router.put("/ip", async (req: Request, res: Response) => {
  const { id, category, ip } = req.body; 
  if (!id || !category || !ip) return res.status(400).send("id, category and ip are required");

  try {
    const result = await pool.query(
      "UPDATE firewall_ips SET category=$1, ip=$2 WHERE id=$3 RETURNING *",
      [category, ip, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//DELETE
router.delete("/ip", async (req: Request, res: Response) => {
  const { values, mode } = req.body; // values = מערך IPs, mode = "blacklist" או "whitelist"

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  try {
    await pool.query(
      `DELETE FROM firewall_ips WHERE ip = ANY($1) AND category = $2`,
      [values, mode]
    );

    res.json({
      type: "ip",
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