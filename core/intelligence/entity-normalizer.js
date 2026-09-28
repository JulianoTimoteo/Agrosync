// Cataloga e diferencia USINA, FRENTE, EQUIPAMENTO, OPERAÇÃO, etc.
class EntityNormalizer {
    static normalize(rawName, rawContext) {
        const name = String(rawName || '').trim().toUpperCase();
        
        if (name === 'OFICINA' || name === 'MANUTENCAO' || name.includes('BORRACHARIA')) {
            return { id: name, name: name, type: 'OPERACAO_MANUTENCAO' };
        }
        if (name.startsWith('FRENTE') || name.startsWith('F.')) {
            return { id: name, name: name, type: 'FRENTE' };
        }
        if (name.includes('TR') || name.includes('CH') || /\d{3,}/.test(name)) {
            return { id: name, name: name, type: 'EQUIPAMENTO' };
        }
        if (['CLIMA', 'CHUVA', 'AGUARDANDO'].some(k => name.includes(k))) {
            return { id: name, name: name, type: 'MOTIVO_IMPRODUTIVO' };
        }
        if (['COLHEDORA', 'TRANSBORDO', 'CAMINHAO'].includes(name)) {
            return { id: name, name: name, type: 'CATEGORIA_EQUIPAMENTO' };
        }
        return { id: name, name: name, type: 'DESCONHECIDO' };
    }
}
window.EntityNormalizer = EntityNormalizer;
