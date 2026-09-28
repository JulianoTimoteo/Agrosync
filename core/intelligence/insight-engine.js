// Orquestra a geração do objeto de Insight rigorosamente estruturado
class InsightEngine {
    static generate(entity, metric, currentValue, historicalData, contextData) {
        const baseline = BaselineEngine.calculateBaseline(entity.id, metric.name, historicalData, contextData);
        if (baseline === null) return null;

        const anomaly = AnomalyEngine.detect(currentValue, baseline, metric);
        if (!anomaly || !anomaly.isAnomaly) return null;

        const trend = TrendEngine.analyzeSeries(historicalData);
        
        const anomalyFlags = historicalData ? historicalData.map(v => {
            const dev = (v - baseline) / baseline * 100;
            return Math.abs(dev) > 10;
        }) : [true];
        const persistence = PersistenceEngine.evaluate(anomalyFlags);
        
        const confidence = ConfidenceEngine.calculate(historicalData ? historicalData.length : 1, 1.0);

        let title = '';
        let severity = '';
        if (anomaly.isImprovement) {
            title = `Melhoria Operacional - ${metric.name}`;
            severity = 'OPORTUNIDADE';
        } else {
            title = `Desvio Operacional - ${metric.name}`;
            severity = persistence.status === 'PERSISTENTE' ? 'CRITICO' : 'ATENCAO';
        }

        return {
            id: `INS-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            title: title,
            severity: severity,
            entity: entity,
            metric: metric,
            currentValue: currentValue,
            baseline: baseline,
            deviation: anomaly.percentDeviation,
            isImprovement: anomaly.isImprovement,
            trend: trend,
            persistence: persistence,
            confidence: confidence,
            evidence: { correlations: [], hypothesis: "" },
            timestamp: Date.now()
        };
    }
}
window.InsightEngine = InsightEngine;
