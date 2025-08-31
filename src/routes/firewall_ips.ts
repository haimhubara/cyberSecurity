import { Router, Request, Response } from "express";
import db from "../config/db";
import { firewallIps } from "../drizzle/schema";
import net from "net";
import { eq, inArray, and } from "drizzle-orm";

const router = Router();

// פונקציה לבדוק תקינות IP
function isValidIP(ip: string): boolean {
  return net.isIP(ip) !== 0;
}

// פונקציה לבדוק תקינות category
function isValidCategory(category: any): category is "blacklist" | "whitelist" {
  return category === "blacklist" || category === "whitelist";
}

// ==================== READ ====================
router.get("/ip", async (req: Request, res: Response) => {
  const { id, category } = req.query;

  try {
    let rows;

    if (id !== undefined) {
      rows = await db.select().from(firewallIps).where(eq(firewallIps.id, Number(id)));
    } else if (category !== undefined) {
      if (!isValidCategory(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      rows = await db.select().from(firewallIps).where(eq(firewallIps.category, category));
    } else {
      rows = await db.select().from(firewallIps);
    }

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error" });
  }
});

// ==================== CREATE ====================
router.post("/ip", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values (array) and mode are required" });
  }

  if (!isValidCategory(mode)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  try {
    const insertedValues: string[] = [];

    for (const ip of values) {
      if (!isValidIP(ip)) {
        return res.status(400).json({ error: `Invalid IP: ${ip}` });
      }

      const [inserted] = await db
        .insert(firewallIps)
        .values({ category: mode, ip })
        .returning({ ip: firewallIps.ip });

      insertedValues.push(inserted.ip);
    }

    return res.status(201).json({
      type: "ip",
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
router.put("/ip", async (req: Request, res: Response) => {
  const { id, category, ip } = req.body;

  if (!id || !category || !ip) {
    return res.status(400).json({ error: "id, category and ip are required" });
  }

  if (!isValidCategory(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (!isValidIP(ip)) {
    return res.status(400).json({ error: `Invalid IP: ${ip}` });
  }

  try {
    const [updated] = await db
      .update(firewallIps)
      .set({ category, ip })
      .where(eq(firewallIps.id, Number(id)))
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
router.delete("/ip", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values (array) and mode are required" });
  }

  if (!isValidCategory(mode)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  try {
    await db
      .delete(firewallIps)
      .where(and(inArray(firewallIps.ip, values), eq(firewallIps.category, mode)));

    return res.json({
      type: "ip",
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
