import { Router, Request, Response } from "express";
import db from "../config/db";
import { firewallPorts } from "../drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";

const router = Router();

// פונקציה לבדוק תקינות category
function isValidCategory(category: any): category is "blacklist" | "whitelist" {
  return category === "blacklist" || category === "whitelist";
}

// פונקציה לבדוק תקינות port
function isValidPort(port: any): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// ==================== READ ====================
router.get("/port", async (req: Request, res: Response) => {
  const { id, category } = req.query;

  try {
    let rows;

    if (id !== undefined) {
      rows = await db.select().from(firewallPorts).where(eq(firewallPorts.id, Number(id)));
    } else if (category !== undefined) {
      if (!isValidCategory(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      rows = await db.select().from(firewallPorts).where(eq(firewallPorts.category, category));
    } else {
      rows = await db.select().from(firewallPorts);
    }

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error" });
  }
});

// ==================== CREATE ====================
router.post("/port", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values (array) and mode are required" });
  }

  if (!isValidCategory(mode)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (!values.every(isValidPort)) {
    return res.status(400).json({ error: "All ports must be integers between 1 and 65535" });
  }

  try {
    const insertedValues: number[] = [];

    for (const port of values) {
      const [inserted] = await db
        .insert(firewallPorts)
        .values({ category: mode, port })
        .returning({ port: firewallPorts.port });

      insertedValues.push(inserted.port);
    }

    return res.status(201).json({
      type: "port",
      mode,
      values: insertedValues,
      status: "success",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error" });
  }
});

// ==================== UPDATE ====================
router.put("/port", async (req: Request, res: Response) => {
  const { id, category, port } = req.body;

  if (!id || !category || !port) {
    return res.status(400).json({ error: "id, category and port are required" });
  }

  if (!isValidCategory(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (!isValidPort(port)) {
    return res.status(400).json({ error: "Port must be an integer between 1 and 65535" });
  }

  try {
    const [updated] = await db
      .update(firewallPorts)
      .set({ category, port })
      .where(eq(firewallPorts.id, Number(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Record not found" });
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error" });
  }
});

// ==================== DELETE ====================
router.delete("/port", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values (array) and mode are required" });
  }

  if (!isValidCategory(mode)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (!values.every(isValidPort)) {
    return res.status(400).json({ error: "All ports must be integers between 1 and 65535" });
  }

  try {
    await db
      .delete(firewallPorts)
      .where(and(inArray(firewallPorts.port, values), eq(firewallPorts.category, mode)));

    return res.json({
      type: "port",
      mode,
      values,
      status: "success",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error" });
  }
});

export default router;
