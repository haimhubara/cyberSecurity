import { Router, Request, Response } from "express";
import db from "../config/db";
import { firewallIps, firewallUrls, firewallPorts } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// ==================== GET all rules ====================
router.get("/rules", async (_req: Request, res: Response) => {
  try {
    const [ips, urls, ports] = await Promise.all([
      db.select().from(firewallIps),
      db.select().from(firewallUrls),
      db.select().from(firewallPorts),
    ]);

    const formatByCategory = (rows: any[]) => ({
      blacklist: rows.filter(r => r.category === "blacklist"),
      whitelist: rows.filter(r => r.category === "whitelist"),
    });

    res.json({
      ips: formatByCategory(ips),
      urls: formatByCategory(urls),
      ports: formatByCategory(ports),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// ==================== UPDATE rules activation ====================
router.put("/rules", async (req: Request, res: Response) => {
  const { ips, urls, ports } = req.body;
  const updated: any[] = [];

  try {
    const updateActive = async (table: any, ids: number[], active: boolean, valueColumn: string) => {
      if (!ids || !ids.length) return;
      const result = await db
        .update(table)
        .set({ active })
        .where(inArray(table.id, ids))
        .returning({ id: table.id, value: table[valueColumn], active: table.active });

      updated.push(...result);
    };

    if (ips) await updateActive(firewallIps, ips.ids, ips.active, "ip");
    if (urls) await updateActive(firewallUrls, urls.ids, urls.active, "url");
    if (ports) await updateActive(firewallPorts, ports.ids, ports.active, "port");

    res.json({ updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
