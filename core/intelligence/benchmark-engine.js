class BenchmarkEngine {
    static rank(currentValue, allValues) {
        if (!allValues || allValues.length === 0) return 'INDEFINIDO';
        const sorted = [...allValues].sort((a,b) => b - a);
        const pos = sorted.indexOf(currentValue);
        if (pos === -1) return 'NA';
        if (pos < sorted.length * 0.3) return 'ACIMA_DA_MEDIA';
        if (pos > sorted.length * 0.7) return 'ABAIXO_DA_MEDIA';
        return 'NA_MEDIA';
    }
}
window.BenchmarkEngine = BenchmarkEngine;
