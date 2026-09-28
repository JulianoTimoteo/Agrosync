class DeduplicationEngine {
    static deduplicate(insights) {
        const unique = new Map();
        insights.forEach(ins => {
            const fingerprint = `${ins.entity.id}_${ins.metric.name}`;
            if (!unique.has(fingerprint)) {
                unique.set(fingerprint, ins);
            } else {
                const existing = unique.get(fingerprint);
                if (Math.abs(ins.deviation) > Math.abs(existing.deviation)) {
                    unique.set(fingerprint, ins);
                }
            }
        });
        return Array.from(unique.values());
    }
}
window.DeduplicationEngine = DeduplicationEngine;
