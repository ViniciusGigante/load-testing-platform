import express from 'express';
import { pool } from './models/db.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'supervisor'
  });
});

app.get('/metrics', async (req, res) => {
  try {
    const loadQuery = `
      SELECT
        instance_id,
        COUNT(*) AS total_events,
        ROUND(AVG(latency_ms)::numeric, 2) AS avg_latency_ms,
        ROUND(MAX(latency_ms)::numeric, 2) AS max_latency_ms
      FROM event_logs
      GROUP BY instance_id
      ORDER BY instance_id;
    `;

    const recentEventsQuery = `
      SELECT
        client_id,
        amount,
        instance_id,
        latency_ms,
        received_at
      FROM event_logs
      ORDER BY received_at DESC
      LIMIT 10;
    `;

    const totalEventsQuery = `
      SELECT COUNT(*) AS total
      FROM event_logs;
    `;

    const [load, recent, total] = await Promise.all([
      pool.query(loadQuery),
      pool.query(recentEventsQuery),
      pool.query(totalEventsQuery)
    ]);

    return res.status(200).json({
      generated_at: new Date().toISOString(),

      overview: {
        total_events: Number(total.rows[0].total)
      },

      servers: load.rows,

      recent_events: recent.rows
    });

  } catch (err) {
    console.error('Erro ao consultar métricas:', err);

    return res.status(500).json({
      error: 'Erro ao consultar métricas'
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Supervisor running on port ${PORT}`);
});