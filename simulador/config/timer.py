import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("TimerSimulado")

ARQUIVO_PADRAO = Path(__file__).parent.parent / "data" / "timer_state.json"

class TimerSimulado:
    def __init__(self, arquivo=ARQUIVO_PADRAO):
        self.arquivo = Path(arquivo)
        self.arquivo.parent.mkdir(parents=True, exist_ok=True)
        self._carregar()

    def _carregar(self):
        if self.arquivo.exists():
            with open(self.arquivo, "r") as f:
                state = json.load(f)

            self.aceleracao    = state.get("aceleracao", 1440)
            self.inicio_simulado = datetime.fromisoformat(state["inicio_simulado"])
            self.checkpoint      = datetime.fromisoformat(state["checkpoint"])
            self.fim_simulado    = datetime.fromisoformat(state["fim_simulado"]) if state.get("fim_simulado") else None
            self.pausado         = state.get("pausado", False)
            self.real_resume     = datetime.now(timezone.utc)

            logger.info(f"Estado carregado. Checkpoint: {self.checkpoint}")
        else:
            agora_real     = datetime.now(timezone.utc)
            agora_simulado = datetime(2026, 1, 1, tzinfo=timezone.utc)

            self.aceleracao      = 1440
            self.inicio_simulado = agora_simulado
            self.checkpoint      = agora_simulado
            self.fim_simulado    = None
            self.pausado         = False
            self.real_resume     = agora_real

            self.salvar()
            logger.info(f"Novo timer criado. Início: {self.inicio_simulado}")

    def agora(self):
        """Retorna o tempo simulado atual."""
        if self.pausado:
            return self.checkpoint

        delta_real  = datetime.now(timezone.utc) - self.real_resume
        tempo_atual = self.checkpoint + (delta_real * self.aceleracao)

        if self.fim_simulado and tempo_atual >= self.fim_simulado:
            self.pausar()
            logger.info(f"Timer atingiu fim_simulado: {self.fim_simulado}")
            return self.fim_simulado

        return tempo_atual

    def pausar(self):
        if self.pausado:
            return
        self.checkpoint = self.agora()
        self.pausado    = True
        self.salvar()
        logger.info(f"Pausado em: {self.checkpoint}")

    def retomar(self):
        if not self.pausado:
            return
        self.real_resume = datetime.now(timezone.utc)
        self.pausado     = False
        self.salvar()
        logger.info(f"Retomado a partir de: {self.checkpoint}")

    def definir_fim(self, fim: datetime):
        """Define quando o timer deve parar automaticamente."""
        self.fim_simulado = fim
        self.salvar()
        logger.info(f"Fim definido para: {self.fim_simulado}")

    def salvar(self):
        state = {
            "aceleracao":      self.aceleracao,
            "inicio_simulado": self.inicio_simulado.isoformat(),
            "checkpoint":      self.checkpoint.isoformat(),
            "fim_simulado":    self.fim_simulado.isoformat() if self.fim_simulado else None,
            "pausado":         self.pausado
        }
        with open(self.arquivo, "w") as f:
            json.dump(state, f, indent=2)