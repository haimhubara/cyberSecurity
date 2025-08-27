import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",       
  host: "localhost",      
  database: "postgres",       
  password: "12345678",   
  port: 8000              
});

export default pool;