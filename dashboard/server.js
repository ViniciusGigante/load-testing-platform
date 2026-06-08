import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { pool } from './models/db.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT2 || 4000;

/* ─────────────────────────────
   HTTP SERVER
───────────────────────────── */
const server = http.createServer(app);

/* ─────────────────────────────
   WEBSOCKET SERVER
───────────────────────────── */
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    timestamp: new Date().toISOString()
  }));

  ws.on('error', (err) => {
    console.error('[WS] Erro no cliente WS:', err);
  });
});

/* ─────────────────────────────
   METRICS CORE
───────────────────────────── */
async function getMetrics() {
  const loadQuery = `
    SELECT
      instance_id,
      COUNT(*) AS total_events,
      ROUND(AVG(latency_ms)::numeric, 2) AS avg_latency_ms,
      ROUND(MAX(latency_ms)::numeric, 2) AS max_latency_ms,
      MAX(received_at) AS last_seen
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

  /* ─────────────────────────────
     CARGA RECENTE (RESILIÊNCIA)
  ───────────────────────────── */
  const recentLoadQuery = `
    SELECT
      instance_id,
      COUNT(*) AS events_last_10s
    FROM event_logs
    WHERE received_at >= NOW() - INTERVAL '10 seconds'
    GROUP BY instance_id
    ORDER BY instance_id;
  `;

  const totalEventsQuery = `
    SELECT COUNT(*) AS total
    FROM event_logs;
  `;

  const [load, recent, recentLoad, total] = await Promise.all([
    pool.query(loadQuery),
    pool.query(recentEventsQuery),
    pool.query(recentLoadQuery),
    pool.query(totalEventsQuery)
  ]);

  /* ─────────────────────────────
     NORMALIZA CARGA RECENTE
  ───────────────────────────── */
  const recentMap = new Map(
    recentLoad.rows.map(r => [r.instance_id, Number(r.events_last_10s)])
  );

  const servers = load.rows.map(s => {
    const lastSeen = s.last_seen
      ? new Date(s.last_seen).getTime()
      : null;

    const secondsSinceLastSeen = lastSeen
      ? (Date.now() - lastSeen) / 1000
      : Infinity;

    return {
      ...s,
      events_last_10s: recentMap.get(s.instance_id) || 0,
      req_per_sec: (recentMap.get(s.instance_id) || 0) / 10,
      status: secondsSinceLastSeen > 5 ? 'OFFLINE' : 'ONLINE'
    };
  });

  return {
    generated_at: new Date().toISOString(),

    overview: {
      total_events: Number(total.rows[0].total)
    },

    servers,

    recent_events: recent.rows
  };
}

/* ─────────────────────────────
   HTTP ROUTES
───────────────────────────── */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'supervisor' });
});

app.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.status(200).json(metrics);
  } catch (err) {
    console.error('[HTTP] erro /metrics:', err);
    res.status(500).json({ error: 'Erro ao consultar métricas' });
  }
});

/* ─────────────────────────────
   WEBSOCKET BROADCAST
───────────────────────────── */
const interval = setInterval(async () => {
  try {
    const payload = await getMetrics();

    const message = JSON.stringify(payload);

    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  } catch (err) {
    console.error('[WS] Erro no broadcast:', err);
  }
}, 1000);

/* ─────────────────────────────
   SHUTDOWN
───────────────────────────── */
async function gracefulShutdown() {
  clearInterval(interval);

  wss.close();

  server.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      console.error('[SIGNAL] Erro ao fechar pool:', err);
    }
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/* ─────────────────────────────
   START
───────────────────────────── */
server.listen(PORT);