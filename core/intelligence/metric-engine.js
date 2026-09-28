// Catálogo de métricas reais e seus comportamentos
class MetricEngine {
    static METRICS = {
        PRODUCAO_TONELADAS: { name: 'producao', unit: 't', isHigherBetter: true },
        VIAGENS: { name: 'viagens', unit: 'qtd', isHigherBetter: true },
        TEMPO_PRODUTIVO: { name: 'tempo_produtivo', unit: 'h', isHigherBetter: true },
        TEMPO_IMPRODUTIVO: { name: 'tempo_improdutivo', unit: 'h', isHigherBetter: false },
        DISPONIBILIDADE: { name: 'disponibilidade', unit: '%', isHigherBetter: true },
        EFICIENCIA: { name: 'eficiencia', unit: '%', isHigherBetter: true },
        CONSUMO_ESPECIFICO: { name: 'consumo', unit: 'L/t', isHigherBetter: false }
    };

    static validateMetric(metricName) {
        return Object.values(this.METRICS).some(m => m.name === metricName);
    }
}
window.MetricEngine = MetricEngine;
