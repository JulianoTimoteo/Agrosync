class BottleneckEngine {
    static identifyBottlenecks(frenteData) {
        let bottlenecks = [];
        Object.entries(frenteData.gargalos || {}).forEach(([motivo, horas]) => {
            if (horas > 0) {
                bottlenecks.push({ motivo, horas });
            }
        });
        return bottlenecks.sort((a, b) => b.horas - a.horas);
    }
}
window.BottleneckEngine = BottleneckEngine;
