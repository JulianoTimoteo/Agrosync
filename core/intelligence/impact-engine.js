class ImpactEngine {
    static calculateImpact(deviationPercent, totalBaseValue) {
        if (!totalBaseValue || totalBaseValue <= 0) return null;
        const absDev = Math.abs(deviationPercent) / 100;
        return totalBaseValue * absDev;
    }
}
window.ImpactEngine = ImpactEngine;
