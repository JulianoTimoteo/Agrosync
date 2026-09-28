class ConfidenceEngine {
    static calculate(dataPointsCount, dataQualityFactor) {
        let conf = 50;
        if (dataPointsCount >= 5) conf += 20;
        if (dataPointsCount >= 10) conf += 30;
        conf = conf * (dataQualityFactor || 1.0);
        if (conf > 99) conf = 99;
        return conf.toFixed(1) + '%';
    }
}
window.ConfidenceEngine = ConfidenceEngine;
