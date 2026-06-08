import asyncio
import random
import time
import logging
import aiohttp
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from config.timer import TimerSimulado
from config.clientes import Cliente
from config.oscilador import calcular_multiplicador

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("Simulador")

# ─────────────────────────────────────────
# CONFIGURAÇÃO
# ─────────────────────────────────────────

BACKEND_URL = "http://nginx:80/api/ingest"
TOTAL_CLIENTES = 100
SLEEP_MIN      = 0.5   # segundos reais mínimos entre decisões por cliente
SLEEP_MAX      = 5.0   # segundos reais máximos entre decisões por cliente


# ─────────────────────────────────────────
# LOOP INDIVIDUAL DE CADA CLIENTE
# ─────────────────────────────────────────

async def loop_cliente(cliente: Cliente, timer: TimerSimulado, session: aiohttp.ClientSession):
    while True:
        # cada cliente dorme um tempo próprio e aleatório
        await asyncio.sleep(random.uniform(SLEEP_MIN, SLEEP_MAX))

        cliente.atualizar_interesse()

        tempo_simulado      = timer.agora()
        multiplicador       = calcular_multiplicador(tempo_simulado)

        if not cliente.decide_comprar(multiplicador_sazonal=multiplicador):
            continue

        evento = {
            "client_id": str(cliente.id),
            "amount":    round(random.uniform(10.0, 500.0), 2),
            "timestamp": tempo_simulado.isoformat(),
        }
        print(evento)
        await enviar_evento(session, evento, cliente.id)


# ─────────────────────────────────────────
# ENVIO DO EVENTO AO BACKEND
# ─────────────────────────────────────────

async def enviar_evento(session: aiohttp.ClientSession, evento: dict, cliente_id):
    evento_payload = {**evento, "sent_at": time.time() * 1000}
    inicio = time.perf_counter()
    try:
        async with session.post(BACKEND_URL, json={"events": [evento_payload]}) as resp:
            latencia_ms = round((time.perf_counter() - inicio) * 1000, 2)
            if resp.status == 202:
                logger.info(
                    f"[Cliente {str(cliente_id):>3}] COMPROU | "
                    f"amount={evento['amount']:>7.2f} | "
                    f"latencia={latencia_ms:>6.1f}ms | "
                    f"ts={evento['timestamp']}"
                )
            else:
                logger.warning(f"[Cliente {cliente_id}] Resposta inesperada: {resp.status}")
    except aiohttp.ClientConnectorError:
        logger.error(f"[Cliente {cliente_id}] Backend indisponível — evento descartado.")
    except Exception as e:
        logger.error(f"[Cliente {cliente_id}] Erro ao enviar evento: {e}")

# ─────────────────────────────────────────
# LOOP DE PERSISTÊNCIA DO TIMER
# ─────────────────────────────────────────

async def loop_timer(timer: TimerSimulado, intervalo: int = 10):
    """Salva o estado do timer a cada N segundos reais."""
    while True:
        await asyncio.sleep(intervalo)
        timer.salvar()
        logger.info(f"[Timer] Checkpoint salvo: {timer.agora().strftime('%Y-%m-%d %H:%M:%S')}")


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

async def main():
    logger.info("Iniciando simulador...")

    timer    = TimerSimulado()
    clientes = [Cliente(i) for i in range(TOTAL_CLIENTES)]

    logger.info(f"{TOTAL_CLIENTES} clientes criados.")
    logger.info(f"Tempo simulado inicial: {timer.agora().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Aceleração: {timer.aceleracao}x")

    async with aiohttp.ClientSession() as session:
        tasks = [loop_cliente(c, timer, session) for c in clientes]
        tasks.append(loop_timer(timer))
        await asyncio.gather(*tasks)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Simulador encerrado.")