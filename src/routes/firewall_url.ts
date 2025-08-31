import { Router, Request, Response } from "express";
import db from "../config/db";
import { firewallUrls } from "../drizzle/schema";
import { eq, inArray, and } from "drizzle-orm";

const router = Router();

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidCategory(category: any): category is "blacklist" | "whitelist" {
  return category === "blacklist" || category === "whitelist";
}

// ==================== READ ====================
router.get("/url", async (req: Request, res: Response) => {
  const { id, category } = req.query;

  try {
    let rows;

    if (id !== undefined) {
      rows = await db.select().from(firewallUrls).where(eq(firewallUrls.id, Number(id)));
    } else if (category !== undefined) {
      if (!isValidCategory(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      rows = await db.select().from(firewallUrls).where(eq(firewallUrls.category, category));
    } else {
      rows = await db.select().from(firewallUrls);
    }

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error" });
  }
});

// ==================== CREATE ====================
router.post("/url", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values (array) and mode are required" });
  }

  if (!isValidCategory(mode)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (!values.every((v: string) => typeof v === "string" && isValidUrl(v))) {
    return res.status(400).json({ error: "All values must be valid URLs" });
  }

  try {
    const insertedValues: string[] = [];

    for (const url of values) {
      const [inserted] = await db
        .insert(firewallUrls)
        .values({ category: mode, url })
        .returning({ url: firewallUrls.url });

      insertedValues.push(inserted.url);
    }

    return res.status(201).json({
      type: "url",
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
router.put("/url", async (req: Request, res: Response) => {
  const { id, category, url } = req.body;

  if (!id || !category || !url) {
    return res.status(400).json({ error: "id, category and url are required" });
  }

  if (!isValidCategory(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const [updated] = await db
      .update(firewallUrls)
      .set({ category, url })
      .where(eq(firewallUrls.id, Number(id)))
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
router.delete("/url", async (req: Request, res: Response) => {
  const { values, mode } = req.body;

  if (!values || !Array.isArray(values) || !mode) {
    return res.status(400).json({ error: "values (array) and mode are required" });
  }

  if (!isValidCategory(mode)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  try {
    await db
      .delete(firewallUrls)
      .where(and(inArray(firewallUrls.url, values), eq(firewallUrls.category, mode)));

    return res.json({
      type: "url",
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
