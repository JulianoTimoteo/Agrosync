// Calcula a referência para uma entidade baseada no histórico ou contexto
class BaselineEngine {
    static calculateBaseline(entityId, metricName, historicalData, contextData) {
        if (!historicalData || historicalData.length === 0) {
            if (contextData && contextData.length > 0) {
                const sum = contextData.reduce((acc, val) => acc + val, 0);
                return sum / contextData.length;
            }
            return null; // DADOS_INSUFICIENTES
        }
        const sum = historicalData.reduce((acc, val) => acc + val, 0);
        return sum / historicalData.length;
    }
}
window.BaselineEngine = BaselineEngine;
