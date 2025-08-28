import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

//READ
router.get("/port", async (req: Request, res: Response) => {
  const { id, category } = req.query;

  try {
    let result;
    if (id) {
      result = await pool.query("SELECT * FROM firewall_ports WHERE id=$1", [id]);
    } else if (category) {
      result = await pool.query("SELECT * FROM firewall_ports WHERE category=$1", [category]);
    } else {
      result = await pool.query("SELECT * FROM firewall_ports");
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//CREATE
router.post("/port", async (req: Request, res: Response) => {
  const { values, mode } = req.body; 

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  if (!values.every(v => Number.isInteger(v))) {
    return res.status(400).send("All ports must be integers");
  }
  if (!values.every(v => v >= 1 && v <= 65535)) {
    return res.status(400).send("Ports must be between 1 and 65535");
  }

  try {
    const insertedValues = [];
    for (const port of values) {
      const result = await pool.query(
        "INSERT INTO firewall_ports (category, port) VALUES ($1, $2) RETURNING port",
        [mode, port]
      );
      insertedValues.push(result.rows[0].port);
    }

    res.status(201).json({
      type: "port",
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
router.put("/port", async (req: Request, res: Response) => {
  const { id, category, port } = req.body; 
  if (!id || !category || !port) return res.status(400).send("id, category and port are required");

  try {
    const result = await pool.query(
      "UPDATE firewall_ports SET category=$1, port=$2 WHERE id=$3 RETURNING *",
      [category, port, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

//DELETE
router.delete("/port", async (req: Request, res: Response) => {
  const { values, mode } = req.body; // values = מערך ports, mode = "blacklist" או "whitelist"

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).send("values (array) and mode are required");
  }

  try {
    await pool.query(
      `DELETE FROM firewall_ports WHERE port = ANY($1) AND category = $2`,
      [values, mode]
    );

    res.json({
      type: "port",
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