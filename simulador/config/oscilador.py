import random
from datetime import datetime


# ─────────────────────────────────────────
# FATORES BASE POR PERÍODO
# ─────────────────────────────────────────

HORA_FATOR = {
    "madrugada": (0,  6,  0.3),   # (hora_inicio, hora_fim, fator_base)
    "manha":     (6,  12, 1.2),
    "tarde":     (12, 18, 1.5),
    "noite":     (18, 24, 0.9),
}

SEMANA_FATOR = {
    0: 1.1,   # segunda
    1: 1.1,   # terça
    2: 1.2,   # quarta
    3: 1.1,   # quinta
    4: 1.3,   # sexta
    5: 0.6,   # sábado
    6: 0.4,   # domingo
}

MES_FATOR = {
    1:  0.7,   # janeiro  — pós-festas
    2:  0.8,
    3:  0.9,
    4:  1.0,
    5:  1.0,
    6:  1.1,
    7:  0.9,   # julho    — férias
    8:  1.0,
    9:  1.1,
    10: 1.2,
    11: 1.4,   # novembro — Black Friday
    12: 1.6,   # dezembro — natal
}

def _fator_dia_do_mes(dia: int) -> float:
    """Virada (1-5): alta. Meio (10-20): normal. Fim (25+): alta."""
    if dia <= 5:
        return 1.3    # virada — salário
    elif dia <= 9:
        return 1.0
    elif dia <= 20:
        return 0.9    # meio do mês — mais calmo
    elif dia <= 24:
        return 1.0
    else:
        return 1.2    # fim do mês — contas e compras


def _fator_hora(hora: int) -> float:
    for periodo, (inicio, fim, fator) in HORA_FATOR.items():
        if inicio <= hora < fim:
            return fator
    return 1.0


def _ruido(fator: float, intensidade: float = 0.15) -> float:
    """Aplica variação aleatória proporcional ao fator."""
    variacao = random.uniform(-intensidade, intensidade)
    return max(0.1, fator + variacao)


# ─────────────────────────────────────────
# FUNÇÃO PRINCIPAL
# ─────────────────────────────────────────

def calcular_multiplicador(tempo_simulado: datetime) -> float:
    """
    Recebe o tempo simulado atual e retorna o multiplicador
    sazonal combinado com ruído aleatório.
    """
    hora    = tempo_simulado.hour
    weekday = tempo_simulado.weekday()
    dia     = tempo_simulado.day
    mes     = tempo_simulado.month

    fator_h = _fator_hora(hora)
    fator_s = SEMANA_FATOR[weekday]
    fator_d = _fator_dia_do_mes(dia)
    fator_m = MES_FATOR[mes]

    # combina os 4 fatores com média ponderada
    multiplicador = (
        fator_h * 0.40 +   # hora do dia tem mais peso
        fator_s * 0.25 +
        fator_d * 0.20 +
        fator_m * 0.15
    )

    return _ruido(multiplicador)