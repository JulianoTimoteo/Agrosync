class PersistenceEngine {
    static evaluate(anomalyFlags) {
        if (!anomalyFlags || anomalyFlags.length === 0) return { status: 'ISOLADO', occurrences: 1, totalPeriods: 1 };
        const occurrences = anomalyFlags.filter(f => f).length;
        const totalPeriods = anomalyFlags.length;
        const ratio = occurrences / totalPeriods;
        
        let status = 'ISOLADO';
        if (ratio >= 0.5) status = 'PERSISTENTE';
        else if (ratio >= 0.2) status = 'RECORRENTE';
        
        return { status, occurrences, totalPeriods };
    }
}
window.PersistenceEngine = PersistenceEngine;
