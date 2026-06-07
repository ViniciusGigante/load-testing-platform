const SUPERVISOR_WS = "ws://localhost:4000";
const SUPERVISOR_HTTP = "http://localhost:4000/metrics";

let ws;

function connectWS(onMessage, onStatus) {
  ws = new WebSocket(SUPERVISOR_WS);

  ws.onopen = () => {
    window.state.connected = true;
    onStatus(true);
  };

  ws.onmessage = (event) => {
    console.log('[WS] mensagem recebida:', event.data);
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onclose = () => {
    window.state.connected = false;
    onStatus(false);

    // fallback polling
    setTimeout(startPolling, 2000);
  };
}

async function startPolling(onMessage) {
  try {
    const res = await fetch(SUPERVISOR_HTTP);
    const data = await res.json();

    onMessage(data);
  } catch (e) {
    console.error("HTTP fallback failed", e);
  }

  setTimeout(() => startPolling(onMessage), 2000);
}

export { connectWS, startPolling };