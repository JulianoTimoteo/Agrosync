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

        // 2. Extrair métricas de Produção (Frentes x Meta x Disponibilidade)
        let avgDispCam = 100, avgDispColh = 100, avgDispTransb = 100;
        let globalBottleneckStr = null;
        if (typeof window.getPotencialData === 'function') {
            const potData = window.getPotencialData();
            const keys = Object.keys(potData);
            if (keys.length > 0) {
                let sCam = 0, sColh = 0, sTrans = 0, c = 0;
                keys.forEach(k => {
                    const d = potData[k];
                    if (d.dispCam != null && d.dispColh != null && d.dispTransb != null) {
                        sCam += d.dispCam;
                        sColh += d.dispColh;
                        sTrans += d.dispTransb;
                        c++;
                    }
                });
                if (c > 0) {
                    avgDispCam = (sCam / c) * 100;
                    avgDispColh = (sColh / c) * 100;
                    avgDispTransb = (sTrans / c) * 100;
                    
                    let minDisp = Math.min(avgDispCam, avgDispColh, avgDispTransb);
                    if (minDisp < 95) { // Se houver indisponibilidade limitante (menor que 95%)
                        if (minDisp === avgDispCam) globalBottleneckStr = `Caminhões (${minDisp.toFixed(1)}%)`;
                        else if (minDisp === avgDispTransb) globalBottleneckStr = `Transbordo (${minDisp.toFixed(1)}%)`;
                        else globalBottleneckStr = `Colhedoras (${minDisp.toFixed(1)}%)`;
                    }
                }
            }
        }

        if (typeof window.rpCalcPorFrente === 'function') {
            const frentesData = window.rpCalcPorFrente();
            if (frentesData && frentesData.length > 0) {
                const allProds = frentesData.map(f => f.realizado);
                frentesData.forEach(f => {
                    const planejadoOrMeta = f.planejado || f.meta24h;
                    if (f.meta24h > 0 && f.realizado < planejadoOrMeta) {
                        const entity = EntityNormalizer.normalize(f.frente, 'BALANCA');
                        const insight = InsightEngine.generate(
                            entity,
                            MetricEngine.METRICS.PRODUCAO_TONELADAS,
                            f.realizado,
                            [f.realizado, f.realizado, f.realizado],
                            allProds
                        );
                        if (insight) {
                            insight.title = `Desvio de Produção - Frente ${f.frente}`;
                            insight.severity = (f.realizado < planejadoOrMeta * 0.7) ? 'CRITICO' : 'ATENCAO';
                            insight.deviation = ((f.realizado - planejadoOrMeta) / planejadoOrMeta) * 100;
                            insight.evidence.hypothesis = `A frente atingiu ${f.realizado.toFixed(1)}t (Planejado/Meta: ${planejadoOrMeta.toFixed(1)}t).`;
                            
                            if (globalBottleneckStr) {
                                insight.evidence.hypothesis += ` Indisponibilidade de frota detectada neste turno! Gargalo logístico apontado: ${globalBottleneckStr}.`;
                            } else {
                                insight.evidence.hypothesis += ` Disponibilidade da frota normal. Provável gargalo local (ex: tráfego, clima ou embuchamento).`;
                            }
                            rawInsights.push(insight);
                        }
                    }
                });
            }
        } else if (balanceData && balanceData.length > 0) {
            // Fallback
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
                const insightProd = InsightEngine.generate(entity, MetricEngine.METRICS.PRODUCAO_TONELADAS, d.total, [d.total, d.total, d.total], allProds);
                if (insightProd) rawInsights.push(insightProd);
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
