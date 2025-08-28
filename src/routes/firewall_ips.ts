import { Router, Request, Response } from "express";
import { pool } from "../db";
import net from "net";

const router = Router();

function isValidIP(ip: string): boolean {
  return net.isIP(ip) !== 0; 
}

// READ
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

// CREATE
router.post("/ip", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  try {
    const insertedValues: string[] = [];

    for (const ip of values) {
      if (!isValidIP(ip)) {
        return res.status(400).json({ error: `Invalid IP: ${ip}` });
      }

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

// UPDATE
router.put("/ip", async (req: Request, res: Response) => {
  const { id, category, ip } = req.body;

  if (!id || !category || !ip) {
    return res.status(400).send("id, category and ip are required");
  }

  if (!isValidIP(ip)) {
    return res.status(400).json({ error: `Invalid IP: ${ip}` });
  }

  try {
    const result = await pool.query(
      "UPDATE firewall_ips SET category=$1, ip=$2 WHERE id=$3 RETURNING *",
      [category, ip, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// DELETE
router.delete("/ip", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

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
