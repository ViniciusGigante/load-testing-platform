-- 1. DNA da Sazonalidade (Alinhado com sua lógica de Períodos)
CREATE TABLE seasonal_patterns (
    period_name VARCHAR(20) PRIMARY KEY, -- 'madrugada', 'matinal', 'diurno', 'noturno'
    multiplier FLOAT DEFAULT 1.0, 
    expected_volume INT DEFAULT 10
);

-- 2. Fonte Única da Verdade (Mantém-se igual, perfeito)
CREATE TABLE event_logs (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices Estratégicos (Mantêm-se iguais, perfeitos)
CREATE INDEX idx_client_id ON event_logs(client_id);
CREATE INDEX idx_event_timestamp ON event_logs(event_timestamp);

