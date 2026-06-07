import { connectWS, startPolling } from "./api.js";

window.state = { connected: false, metrics: null };

const elStatus  = document.getElementById("status");
const elTotal   = document.getElementById("totalEvents");
const elLatency = document.getElementById("avgLatency");
const elServers = document.getElementById("servers");
const elEvents  = document.getElementById("events");

function render(data) {
  if (!data || !data.overview) return;

  window.state.metrics = data;

  elTotal.textContent = data.overview.total_events.toLocaleString('pt-BR');

  const avg = data.servers?.reduce((a, s) => a + Number(s.avg_latency_ms || 0), 0)
    / (data.servers?.length || 1);
  elLatency.textContent = `${Math.round(avg).toLocaleString('pt-BR')} ms`;

  elServers.innerHTML = (data.servers || []).map(s => `
    <div class="server">
      <strong>${s.instance_id}</strong>
      <div><span>events</span><span>${Number(s.total_events).toLocaleString('pt-BR')}</span></div>
      <div><span>avg latency</span><span>${Math.round(s.avg_latency_ms).toLocaleString('pt-BR')} ms</span></div>
      <div><span>max latency</span><span>${Math.round(s.max_latency_ms).toLocaleString('pt-BR')} ms</span></div>
    </div>
  `).join("");

  elEvents.innerHTML = (data.recent_events || []).map(e => `
    <div class="event">
      <span class="event-instance">${e.instance_id}</span>
      <span class="event-client">client ${e.client_id}</span>
      <span class="event-amount">R$ ${Number(e.amount).toFixed(2)}</span>
      <span class="event-latency">${Math.round(e.latency_ms).toLocaleString('pt-BR')} ms</span>
    </div>
  `).join("");
}

function setStatus(ok) {
  elStatus.textContent = ok ? "● LIVE" : "○ RECONNECTING";
  elStatus.style.background   = ok ? "#0d2e1a" : "#2e1f00";
  elStatus.style.color        = ok ? "#4ade80" : "#fbbf24";
  elStatus.style.borderColor  = ok ? "#166534" : "#854d0e";
}

connectWS(render, setStatus);
startPolling(render);