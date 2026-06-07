-- =========================
-- EVENT LOGS (FONTE PRINCIPAL)
-- =========================

CREATE TABLE event_logs (
    id SERIAL,
    client_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    instance_id VARCHAR(50) NOT NULL,
    latency_ms BIGINT NOT NULL,
    received_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- PARTITION BY RANGE (event_timestamp);

-- =========================
-- ÍNDICES ESSENCIAIS
-- =========================

CREATE INDEX idx_event_time
ON event_logs (event_timestamp);

CREATE INDEX idx_event_client_time
ON event_logs (client_id, event_timestamp);