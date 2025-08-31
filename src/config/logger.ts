import { createLogger, format, transports, Logger } from "winston";
import config from "./env";

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

const logger: Logger = createLogger({
  level: config.env === "dev" ? "debug" : "info",
  format: combine(
    timestamp(),
    config.env === "dev" ? colorize() : format.uncolorize(),
    logFormat
  ),
  transports: [
    config.env === "dev"
      ? new transports.Console()
      : new transports.File({ filename: "app.log" }),
  ],
});

console.log = (...args: any[]) => {
  logger.info(args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" "));
};

console.error = (...args: any[]) => {
  logger.error(args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" "));
};
console.warn = (...args: any[]) => {
  logger.warn(args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" "));
};

export default logger;