import express from 'express';
import { pool } from './models/db.js';

const app = express();

app.use(express.json());

const INSTANCE_ID = process.env.INSTANCE_ID || "unknown";

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.post("/ingest", async (req, res) => {
  const { events } = req.body;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({
      error: "Payload inválido, esperado um array de eventos"
    });
  }

  try {
    const query = `
      INSERT INTO event_logs (
        client_id,
        amount,
        event_timestamp,
        instance_id,
        latency_ms,
        received_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const receivedAt = new Date();

    for (const event of events) {
      const eventTimestamp = new Date(event.timestamp);

      const latencyMs = event.sent_at
        ? Math.round(receivedAt.getTime() - event.sent_at)
        : Math.round(receivedAt.getTime() - eventTimestamp.getTime());

      await pool.query(query, [
        event.client_id,
        event.amount,
        eventTimestamp,
        INSTANCE_ID,
        latencyMs,
        receivedAt
      ]);
    }

    return res.status(202).json({
      status: "Ingested",
      count: events.length,
      instance: INSTANCE_ID
    });

  } catch (err) {
    console.error("Erro ao persistir telemetria:", err);

    return res.status(500).json({
      error: "Erro interno ao salvar eventos"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Backend ${INSTANCE_ID} running on port ${PORT}`
  );
});