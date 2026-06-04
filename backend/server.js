import express from 'express';
import { pool } from './models/db.js';

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.post("/ingest", async (req, res) => {
  const { events } = req.body;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: "Payload inválido, esperado um array de eventos" });
  }

  try {
    const query = 'INSERT INTO event_logs (client_id, amount, event_timestamp) VALUES ($1, $2, $3)';
    
    for (const event of events) {
      await pool.query(query, [event.client_id, event.amount, event.timestamp]);
    }
    
    return res.status(202).json({ 
      status: "Ingested", 
      count: events.length 
    });
  } catch (err) {
    console.error("Erro ao persistir telemetria:", err);
    return res.status(500).json({ error: "Erro interno ao salvar eventos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});