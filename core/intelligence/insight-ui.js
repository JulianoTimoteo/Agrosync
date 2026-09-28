class InsightUI {
    static render(insights) {
        const container = document.getElementById('ai-insights-container');
        if (!container) return;

        const wrapper = container.closest('.ai-card');

        if (!insights || insights.length === 0) {
            if (wrapper) wrapper.style.display = 'none';
            container.innerHTML = '';
            return;
        }
        
        if (wrapper) wrapper.style.display = 'block';

        const anomalies = insights.filter(i => i.severity === 'CRITICO' || i.severity === 'ATENCAO').length;
        const opportunities = insights.filter(i => i.severity === 'OPORTUNIDADE').length;

        let summaryHtml = `
            <div style="background: linear-gradient(135deg, var(--bg-surface-elevated), var(--bg-surface)); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <div style="font-weight: 800; font-size: 16px; margin-bottom: 12px; color: var(--text-primary);">A.I. OPERACIONAL &mdash; RESUMO EXECUTIVO</div>
                <div style="display:flex; gap: 12px; margin-bottom: 12px;">
                    <span style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">&#128308; ${anomalies} Anomalias</span>
                    <span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">&#11088; ${opportunities} Oportunidades</span>
                </div>
            </div>
        `;

        let html = summaryHtml;

        insights.forEach(ins => {
            const badge = this.getBadgeHtml(ins.severity);
            const trendIcon = ins.deviation > 0 ? '&#8593;' : '&#8595;';
            const devValue = Math.abs(ins.deviation).toFixed(1);
            
            let hypothesisHtml = '';
            if (ins.evidence && ins.evidence.hypothesis) {
                hypothesisHtml = `<div style="margin-top: 8px; color: var(--color-warning-text); background: var(--color-warning-bg); padding: 8px; border-radius: 4px; border: 1px solid var(--color-warning-border);"><strong>Hipótese:</strong> ${ins.evidence.hypothesis}</div>`;
            }

            html += `
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-weight: 800; font-size: 15px; color: var(--text-primary);">
                        ${badge} ${ins.title.toUpperCase()} &mdash; ${ins.entity.name.toUpperCase()}
                    </div>
                </div>
                <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.5;">
                    A entidade apresentou ${ins.deviation > 0 ? 'aumento' : 'redução'} de <strong>${devValue}%</strong> na métrica <strong>${ins.metric.name}</strong> em relação ao baseline do contexto operacional.
                    <br><br>
                    <div style="display:flex; gap:16px; margin-top:8px;">
                        <div><strong>Valor Atual:</strong> ${ins.currentValue.toFixed(1)} ${ins.metric.unit}</div>
                        <div><strong>Referência (Média):</strong> ${ins.baseline.toFixed(1)} ${ins.metric.unit}</div>
                        <div><strong>Tendência:</strong> ${ins.trend}</div>
                    </div>
                    ${hypothesisHtml}
                    <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted); display:flex; justify-content: space-between; align-items:center;">
                        <span>Persistência: ${ins.persistence.status} | Confiança: ${ins.confidence}</span>
                        <button onclick="console.log('Investigating', '${ins.entity.id}', '${ins.metric.name}')" style="background: var(--color-primary); color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">INVESTIGAR</button>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }

    static getBadgeHtml(severity) {
        if (severity === 'CRITICO') return `<span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-size:11px;">CRÍTICO</span>`;
        if (severity === 'ATENCAO') return `<span style="background:#ffedd5; color:#9a3412; padding:2px 6px; border-radius:4px; font-size:11px;">ATENÇÃO</span>`;
        if (severity === 'OPORTUNIDADE') return `<span style="background:#dcfce7; color:#166534; padding:2px 6px; border-radius:4px; font-size:11px;">OPORTUNIDADE</span>`;
        return `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:4px; font-size:11px;">INFO</span>`;
    }
}
window.InsightUI = InsightUI;
