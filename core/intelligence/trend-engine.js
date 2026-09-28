// Identifica se é crescimento, queda, estabilidade
class TrendEngine {
    static analyzeSeries(dataPoints) {
        if (!dataPoints || dataPoints.length < 3) return 'DADOS_INSUFICIENTES';
        let trend = 0;
        for (let i = 1; i < dataPoints.length; i++) {
            if (dataPoints[i] > dataPoints[i-1]) trend++;
            else if (dataPoints[i] < dataPoints[i-1]) trend--;
        }
        if (trend >= dataPoints.length / 2) return 'CRESCIMENTO';
        if (trend <= -dataPoints.length / 2) return 'QUEDA';
        return 'ESTABILIDADE';
    }
}
window.TrendEngine = TrendEngine;
