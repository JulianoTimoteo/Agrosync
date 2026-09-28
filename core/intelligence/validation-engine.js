class ValidationEngine {
    static validate(insight) {
        if (!insight) return false;
        if (!insight.entity || insight.entity.type === 'DESCONHECIDO') return false;
        if (!insight.metric) return false;
        if (isNaN(insight.deviation) || !isFinite(insight.deviation)) return false;
        if (Math.abs(insight.deviation) < 5) return false;
        return true;
    }
}
window.ValidationEngine = ValidationEngine;
