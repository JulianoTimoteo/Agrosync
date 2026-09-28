// Define as estruturas padronizadas de eventos e métricas
class DataModel {
    static createEvent(timestamp, entity, metric, sourceContext) {
        return {
            timestamp: timestamp || Date.now(),
            date: new Date(timestamp).toLocaleDateString(),
            hour: new Date(timestamp).getHours(),
            entity: entity, // { type, id, name }
            metric: metric, // { name, value, unit }
            source: sourceContext // { tab, dataset, field }
        };
    }
}
window.DataModel = DataModel;
