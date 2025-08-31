import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";


export const ruleCategory = pgEnum("rule_category", ["blacklist", "whitelist"]);

// ip table
export const firewallIps = pgTable("firewall_ips", {
  id: serial("id").primaryKey(),
  category: ruleCategory("category").notNull(),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// url table
export const firewallUrls = pgTable("firewall_urls", {
  id: serial("id").primaryKey(),
  category: ruleCategory("category").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// port table
export const firewallPorts = pgTable("firewall_ports", {
  id: serial("id").primaryKey(),
  category: ruleCategory("category").notNull(),
  port: integer("port").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
