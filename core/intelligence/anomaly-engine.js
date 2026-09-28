// Detecta desvios significativos em relação ao baseline
class AnomalyEngine {
    static detect(currentValue, baselineValue, metric) {
        if (baselineValue === null || baselineValue === 0) return null;
        
        const deviation = currentValue - baselineValue;
        const percentDeviation = (deviation / baselineValue) * 100;
        
        // Regra de desvio: > 5% para t, > 10% para outros
        const threshold = (metric.unit === 't') ? 5 : 10;
        if (Math.abs(percentDeviation) > threshold) {
            const isPositive = percentDeviation > 0;
            const isGood = metric.isHigherBetter ? isPositive : !isPositive;
            return {
                isAnomaly: true,
                deviationValue: deviation,
                percentDeviation: percentDeviation,
                isImprovement: isGood
            };
        }
        return { isAnomaly: false };
    }
}
window.AnomalyEngine = AnomalyEngine;
