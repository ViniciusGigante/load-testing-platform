from datetime import datetime, timedelta
import json
from pathlib import Path

class TimerSimulado:

    def __init__(self):
        self.arquivo = Path("data/timer_state.json")

        if self.arquivo.exists():
            with open(self.arquivo) as f:
                dados = json.load(f)

            self.data_atual = datetime.fromisoformat(
                dados["simulated_datetime"]
            )
        else:
            self.data_atual = datetime(2026, 1, 1)

    def avancar_dia(self):
        self.data_atual += timedelta(days=1)
        self.salvar()

    def salvar(self):
        with open(self.arquivo, "w") as f:
            json.dump(
                {
                    "simulated_datetime":
                        self.data_atual.isoformat()
                },
                f
            )

    def agora(self):
        return self.data_atual