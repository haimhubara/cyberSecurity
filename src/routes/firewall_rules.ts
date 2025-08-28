import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// GET all rules
router.get("/rules", async (_req: Request, res: Response) => {
  try {
    const [ipsResult, urlsResult, portsResult] = await Promise.all([
      pool.query("SELECT id, ip AS value, active, category FROM firewall_ips"),
      pool.query("SELECT id, url AS value, active, category FROM firewall_urls"),
      pool.query("SELECT id, port AS value, active, category FROM firewall_ports")
    ]);

    const formatByCategory = (rows: any[]) => ({
      blacklist: rows.filter(r => r.category === "blacklist"),
      whitelist: rows.filter(r => r.category === "whitelist")
    });

    res.json({
      ips: formatByCategory(ipsResult.rows),
      urls: formatByCategory(urlsResult.rows),
      ports: formatByCategory(portsResult.rows)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// UPDATE rules activation
router.put("/rules", async (req: Request, res: Response) => {
  const { ips, urls, ports } = req.body;

  const updated: any[] = [];

  try {
    // Helper function
    const updateActive = async (table: string, ids: number[], active: boolean) => {
      if (!ids || !ids.length) return;
      const result = await pool.query(
        `UPDATE ${table} SET active=$1 WHERE id = ANY($2) RETURNING id, ${table === "firewall_ports" ? "port" : table === "firewall_ips" ? "ip" : "url"} AS value, active`,
        [active, ids]
      );
      updated.push(...result.rows);
    };

    if (ips) await updateActive("firewall_ips", ips.ids, ips.active);
    if (urls) await updateActive("firewall_urls", urls.ids, urls.active);
    if (ports) await updateActive("firewall_ports", ports.ids, ports.active);

    res.json({ updated });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

export default router;
