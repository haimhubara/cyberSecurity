CREATE TYPE "public"."rule_category" AS ENUM('blacklist', 'whitelist');--> statement-breakpoint
CREATE TABLE "firewall_ips" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "rule_category" NOT NULL,
	"ip" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "firewall_ports" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "rule_category" NOT NULL,
	"port" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "firewall_urls" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "rule_category" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
