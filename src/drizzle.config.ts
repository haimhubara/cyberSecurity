import config from './config/env';
import { defineConfig } from 'drizzle-kit';

console.log("Drizzle is using database:", config.databaseUri);

export default defineConfig({
  out: './src/drizzle/migrations',
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.databaseUri,
  },
  verbose: true,
  strict: true,
});