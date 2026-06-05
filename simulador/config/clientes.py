import random

class Cliente:
    def __init__(self, id_cliente):
        self.id = id_cliente
        self.taxa_volatilidade = random.uniform(0.1, 0.9)
        self.nivel_interesse = random.random()
        self.fator_vicio = random.uniform(1.0, 2.0)

    def atualizar_interesse(self):
        variacao = random.uniform(-self.taxa_volatilidade, self.taxa_volatilidade)
        self.nivel_interesse = max(0.0, min(1.0, self.nivel_interesse + variacao))

    def decide_comprar(self, multiplicador_sazonal=1.0):
        probabilidade_venda = self.nivel_interesse * self.fator_vicio * multiplicador_sazonal
        return probabilidade_venda > 0.5
    
    