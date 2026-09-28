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


window.runExpertAnalysis = function(type) {
    let reportHtml = '';
    
    if (type === 'frentes') {
        if (typeof window.rpCalcPorFrente !== 'function') {
            alert('Dados de frentes não disponíveis.');
            return;
        }
        const data = window.rpCalcPorFrente();
        if (!data || data.length === 0) {
            alert('Sem dados para análise.');
            return;
        }
        
        let totalMeta = 0, totalRealizado = 0, totalPlanejado = 0;
        let piores = [], melhores = [];
        
        data.forEach(d => {
            totalMeta += d.meta24h;
            totalPlanejado += d.planejado;
            totalRealizado += d.realizado;
            
            let percentual = d.planejado > 0 ? (d.realizado / d.planejado) * 100 : 0;
            if (percentual < 85) piores.push({f: d.frente, p: percentual, diff: d.planejado - d.realizado});
            if (percentual > 105) melhores.push({f: d.frente, p: percentual, over: d.realizado - d.planejado});
        });
        
        piores.sort((a,b) => b.diff - a.diff);
        melhores.sort((a,b) => b.over - a.over);
        
        let perfGlobal = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 0;
        let colorGlobal = perfGlobal < 95 ? 'var(--color-danger-text)' : 'var(--color-success-text)';
        
        reportHtml += `<h3 style="margin-top:0; color:#1e293b;">📊 Análise de Frentes</h3>`;
        reportHtml += `<p>Performance Global vs Planejado: <strong style="color:${colorGlobal}; font-size:16px;">${perfGlobal.toFixed(1)}%</strong> (${window.rpFmtNum(totalRealizado,0)}t de ${window.rpFmtNum(totalPlanejado,0)}t)</p>`;
        
        if (piores.length > 0) {
            reportHtml += `<h4 style="color:var(--color-danger-text); margin-bottom:4px;">🚨 Frentes Críticas (Abaixo de 85% do Planejado)</h4><ul style="margin-top:0; padding-left:20px; font-size:14px; color:#475569;">`;
            piores.slice(0, 3).forEach(p => {
                reportHtml += `<li><strong>Frente ${p.f}</strong>: Entregou apenas ${p.p.toFixed(1)}% (Déficit de ${window.rpFmtNum(p.diff,1)}t)</li>`;
            });
            reportHtml += `</ul>`;
            
            // Contextualizando com gargalos
            if (typeof window.getPotencialData === 'function') {
                const potData = window.getPotencialData();
                let hasLogisticsIssue = false;
                Object.values(potData).forEach(d => {
                    if (d.dispCam < 95 || d.dispTransb < 95) hasLogisticsIssue = true;
                });
                if (hasLogisticsIssue) {
                    reportHtml += `<div style="background:#fee2e2; padding:8px; border-left:4px solid #ef4444; font-size:12px; color:#991b1b; margin-bottom:10px;">
                    <strong>Insight:</strong> A indisponibilidade de frota (caminhões/transbordo) detectada no sistema pode estar impactando diretamente estas frentes.
                    </div>`;
                } else {
                    reportHtml += `<div style="background:#fef3c7; padding:8px; border-left:4px solid #f59e0b; font-size:12px; color:#92400e; margin-bottom:10px;">
                    <strong>Insight:</strong> Frota parece disponível. O déficit pode ser causado por fatores agronômicos, clima, embuchamento ou quebras na frente.
                    </div>`;
                }
            }
        } else {
            reportHtml += `<p style="color:var(--color-success-text); font-weight:bold;">✅ Todas as frentes estão operando dentro ou acima da normalidade!</p>`;
        }
        
        if (melhores.length > 0) {
            reportHtml += `<h4 style="color:var(--color-success-text); margin-bottom:4px;">🏆 Frentes Destaque (Acima de 105%)</h4><ul style="margin-top:0; padding-left:20px; font-size:14px; color:#475569;">`;
            melhores.slice(0, 3).forEach(m => {
                reportHtml += `<li><strong>Frente ${m.f}</strong>: Operando a ${m.p.toFixed(1)}% (Superávit de ${window.rpFmtNum(m.over,1)}t)</li>`;
            });
            reportHtml += `</ul>`;
        }
    } 
    else if (type === 'detalhe') {
        if (typeof window.rpCalcDetalhe !== 'function') {
            alert('Dados de detalhes não disponíveis.');
            return;
        }
        const data = window.rpCalcDetalhe();
        if (!data || data.length === 0) {
            alert('Sem dados para análise.');
            return;
        }
        
        let densidades = [];
        data.forEach(d => {
            if (d.viagens > 0) {
                densidades.push({
                    key: `${d.frente} - ${d.owner} ${d.tipo}`,
                    densidade: d.peso / d.viagens,
                    viagens: d.viagens
                });
            }
        });
        densidades.sort((a,b) => b.densidade - a.densidade);
        
        reportHtml += `<h3 style="margin-top:0; color:#1e293b;">📦 Análise de Densidade e Viagens</h3>`;
        
        if (densidades.length > 0) {
            const avgDensidade = densidades.reduce((acc, curr) => acc + curr.densidade, 0) / densidades.length;
            reportHtml += `<p>Densidade Média Global: <strong>${window.rpFmtNum(avgDensidade, 2)} t/viagem</strong></p>`;
            
            reportHtml += `<h4 style="color:var(--color-success-text); margin-bottom:4px;">📈 Melhores Densidades</h4><ul style="margin-top:0; padding-left:20px; font-size:14px; color:#475569;">`;
            densidades.slice(0, 3).forEach(d => {
                reportHtml += `<li><strong>${d.key}</strong>: ${window.rpFmtNum(d.densidade, 2)} t (${d.viagens} viagens)</li>`;
            });
            reportHtml += `</ul>`;
            
            const piores = densidades.slice().reverse().slice(0, 3);
            reportHtml += `<h4 style="color:var(--color-danger-text); margin-bottom:4px;">📉 Menores Densidades</h4><ul style="margin-top:0; padding-left:20px; font-size:14px; color:#475569;">`;
            piores.forEach(d => {
                reportHtml += `<li><strong>${d.key}</strong>: ${window.rpFmtNum(d.densidade, 2)} t (${d.viagens} viagens)</li>`;
            });
            reportHtml += `</ul>`;
            
            if (piores.length > 0) {
                const pior = piores[0];
                reportHtml += `<div style="background:#fef2f2; padding:8px; border-left:4px solid #ef4444; font-size:12px; color:#991b1b; margin-top:10px;">
                <strong>Insight Operacional:</strong> A configuração <strong>${pior.key}</strong> está com o pior aproveitamento de carga (${window.rpFmtNum(pior.densidade, 2)} t). Veículos rodando leves encarecem o CTT (Custo de Corte, Transbordo e Transporte). Avalie imediatamente o enleiramento e a calibração de carga no transbordo desta frente para evitar perda de eficiência logística.
                </div>`;
            }
        }
    }

    // Evitar sobreposição de múltiplos relatórios
    const existingModal = document.getElementById('expert-analysis-modal-container');
    if (existingModal) existingModal.remove();

    // Criar e injetar modal no DOM
    const modalId = 'expert-analysis-modal-container';
    const modalHtml = `
    <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(4px); opacity:0; transition:opacity 0.3s ease;">
        <div style="background:#ffffff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); width:90%; max-width:500px; max-height:85vh; overflow-y:auto; padding:24px; position:relative; transform:translateY(20px); transition:transform 0.3s ease;">
            <button onclick="document.getElementById('${modalId}').remove()" style="position:absolute; top:16px; right:16px; background:transparent; border:none; font-size:24px; color:#64748b; cursor:pointer; line-height:1;">&times;</button>
            ${reportHtml}
            <div style="margin-top:20px; text-align:right;">
                <button onclick="document.getElementById('${modalId}').remove()" style="background:var(--color-primary); color:#fff; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Entendido</button>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Animação de entrada
    setTimeout(() => {
        const m = document.getElementById(modalId);
        if(m) {
            m.style.opacity = '1';
            m.children[0].style.transform = 'translateY(0)';
        }
    }, 10);
};
