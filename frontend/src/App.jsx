import { useEffect, useState, useRef } from 'react'
import './App.css'

const SUPERVISOR_WS = 'ws://localhost:4000'
const SUPERVISOR_HTTP = 'http://localhost:4000/metrics'

export default function App() {
  const [metrics, setMetrics] = useState(null)
  const [live, setLive] = useState(false)
  const wsRef = useRef(null)

  function handleData(data) {
    if (!data || !data.overview) return
    setMetrics(data)
  }

  async function poll() {
    try {
      const res = await fetch(SUPERVISOR_HTTP)
      const data = await res.json()
      handleData(data)
    } catch (e) {
      console.error('HTTP fallback failed', e)
    }
  }

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(SUPERVISOR_WS)
      wsRef.current = ws

      ws.onopen = () => setLive(true)
      ws.onmessage = (e) => handleData(JSON.parse(e.data))
      ws.onclose = () => {
        setLive(false)
        setTimeout(connect, 2000)
      }
    }

    connect()
    const interval = setInterval(poll, 2000)

    return () => {
      wsRef.current?.close()
      clearInterval(interval)
    }
  }, [])

  const avgLatency = metrics?.servers?.length
    ? metrics.servers.reduce((a, s) => a + Number(s.avg_latency_ms || 0), 0) / metrics.servers.length
    : 0

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="header-icon">◈</span>
          <h1>System Monitor</h1>
        </div>
        <span className={`pill ${live ? 'live' : 'off'}`}>
          {live ? '● LIVE' : '○ RECONNECTING'}
        </span>
      </header>

      <main>
        <section className="metrics-row">
          <div className="metric-card">
            <div className="metric-label">Total Events</div>
            <div className="metric-value">
              {metrics ? metrics.overview.total_events.toLocaleString('pt-BR') : '—'}
            </div>
          </div>
          <div className="metric-card accent-blue">
            <div className="metric-label">Avg Latency</div>
            <div className="metric-value">
              {metrics ? `${Math.round(avgLatency).toLocaleString('pt-BR')} ms` : '—'}
            </div>
          </div>
          <div className="metric-card accent-green">
            <div className="metric-label">Active Servers</div>
            <div className="metric-value">{metrics?.servers?.length ?? '—'}</div>
          </div>
        </section>

        <section className="panel">
          <h2>Servers</h2>
          <div className="server-grid">
            {(metrics?.servers || []).map(s => (
              <div key={s.instance_id} className="server-card">
                <div className="server-name">
                  <span className="dot" />
                  {s.instance_id}
                </div>
                <div className="server-row">
                  <span>Events</span>
                  <span>{Number(s.total_events).toLocaleString('pt-BR')}</span>
                </div>
                <div className="server-row">
                  <span>Avg latency</span>
                  <span>{Math.round(s.avg_latency_ms).toLocaleString('pt-BR')} ms</span>
                </div>
                <div className="server-row">
                  <span>Max latency</span>
                  <span>{Math.round(s.max_latency_ms).toLocaleString('pt-BR')} ms</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Recent Events</h2>
          <div className="event-list">
            {(metrics?.recent_events || []).map((e, i) => (
              <div key={i} className="event-row">
                <span className="event-tag">{e.instance_id}</span>
                <span className="event-client">client {e.client_id}</span>
                <span className="event-amount">R$ {Number(e.amount).toFixed(2)}</span>
                <span className="event-latency">{Math.round(e.latency_ms).toLocaleString('pt-BR')} ms</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}