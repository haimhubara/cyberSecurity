import express, { Request, Response } from 'express';
import firewallIPSRouter from "./routes/firewall_ips";

const app = express();
app.use(express.json());
app.use("/api/firewall", firewallIPSRouter);

// app.get('/', (req: Request, res: Response) => {
//   res.send('Hello, World!');
// });

export default app;