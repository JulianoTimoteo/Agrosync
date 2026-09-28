class CorrelationEngine {
    static findCorrelations(metricValue, otherMetricsContext) {
        let correlations = [];
        if (!otherMetricsContext || otherMetricsContext.length === 0) return correlations;
        const meanOther = otherMetricsContext.reduce((a, b) => a + b, 0) / otherMetricsContext.length;
        if (meanOther > 0) {
             const dev = (metricValue - meanOther) / meanOther * 100;
             if (Math.abs(dev) > 10) {
                 correlations.push({
                     metric: 'Fatores Associados',
                     value: dev,
                     direction: dev > 0 ? 1 : -1
                 });
             }
        }
        return correlations;
    }
}
window.CorrelationEngine = CorrelationEngine;
