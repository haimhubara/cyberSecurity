import express, { Request, Response } from 'express';
import firewallIPSRouter from "./routes/firewall_ips";
import firewallURLRouter from "./routes/firewall_url";
import firewallPortsRouter from "./routes/firewall_ports"; 
import firewallRulesRouter from "./routes/firewall_rules"; 

const app = express();
app.use(express.json());
app.use("/api/firewall", firewallIPSRouter);
app.use("/api/firewall", firewallURLRouter);
app.use("/api/firewall", firewallPortsRouter);
app.use("/api/firewall", firewallRulesRouter);

// app.get('/', (req: Request, res: Response) => {
//   res.send('Hello, World!');
// });

export default app;