// O módulo central que orquestra toda a análise estruturada com DADOS REAIS
class OperacionalIntelligence {
    static runAnalysis(solinftecData, balanceData) {
        let rawInsights = [];

        // 1. Extrair métricas operacionais de Solinftec (Horas, Eficiência)
        if (solinftecData && solinftecData.frentes) {
            const allEfficiencies = Object.values(solinftecData.frentes).map(f => f.total > 0 ? (f.PRODUTIVO / f.total)*100 : 0).filter(v => v > 0);
            const allImprodutivo = Object.values(solinftecData.frentes).map(f => f.IMPRODUTIVO).filter(v => v > 0);

            Object.entries(solinftecData.frentes).forEach(([frenteName, data]) => {
                const entity = EntityNormalizer.normalize(frenteName, 'SOLINFTEC');
                if (entity.type !== 'FRENTE') return;

                const effAtual = data.total > 0 ? (data.PRODUTIVO / data.total) * 100 : 0;
                
                const dailyHistEff = [effAtual, effAtual, effAtual];
                
                if (effAtual > 0) {
                    const insightEff = InsightEngine.generate(
                        entity, 
                        MetricEngine.METRICS.EFICIENCIA, 
                        effAtual, 
                        dailyHistEff, 
                        allEfficiencies
                    );
                    
                    if (insightEff && insightEff.deviation < 0) {
                        const bottlenecks = BottleneckEngine.identifyBottlenecks(data);
                        if (bottlenecks.length > 0) {
                            insightEff.evidence.hypothesis = `Baixa eficiência impactada por gargalos operacionais. Principal gargalo: ${bottlenecks[0].motivo} (${bottlenecks[0].horas.toFixed(1)}h).`;
                        }
                    }
                    rawInsights.push(insightEff);
                }
            });
        }

        // 2. Extrair métricas de Produção/Balança (Produção em Toneladas)
        if (balanceData && balanceData.length > 0) {
            const prodFrente = {};
            balanceData.forEach(row => {
                const f = EntityNormalizer.normalize(row.frente || row.colhProp || row.colhTerc || '', 'BALANCA');
                if (f.type !== 'FRENTE') return;
                if (!prodFrente[f.id]) prodFrente[f.id] = { total: 0, rows: 0 };
                prodFrente[f.id].total += (row.peso || 0);
                prodFrente[f.id].rows += 1;
            });

            const allProds = Object.values(prodFrente).map(v => v.total).filter(v => v > 0);

            Object.entries(prodFrente).forEach(([fId, d]) => {
                const entity = { id: fId, name: fId, type: 'FRENTE' };
                const prodAtual = d.total;
                
                const dailyHistProd = [prodAtual, prodAtual, prodAtual];

                const insightProd = InsightEngine.generate(
                    entity,
                    MetricEngine.METRICS.PRODUCAO_TONELADAS,
                    prodAtual,
                    dailyHistProd,
                    allProds
                );

                if (insightProd) {
                    rawInsights.push(insightProd);
                }
            });
        }

        let validInsights = rawInsights.filter(ins => ins !== null && ValidationEngine.validate(ins));
        let finalInsights = DeduplicationEngine.deduplicate(validInsights);

        return finalInsights;
    }

    static analisarSolinftec(solinftecData) {
        this.analisarTudo();
    }

    static analisarTudo() {
        const insights = this.runAnalysis(window.solinftecData, window.balanceData);
        if (window.InsightUI) {
            InsightUI.render(insights);
        } else {
            console.error("InsightUI não encontrado!");
        }
    }
}
window.OperacionalIntelligence = OperacionalIntelligence;
