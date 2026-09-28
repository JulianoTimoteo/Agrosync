const MatrizPerformanceComponent = {
    render: function(frentesData) {
        const frentesArray = Object.entries(frentesData).map(([nome, data]) => ({ nome, ...data }));
        let tableHtml = '';
        frentesArray.forEach(f => {
            let topGargalo = { nome: '-', horas: 0 };
            Object.entries(f.gargalos).forEach(([nome, horas]) => { if (horas > topGargalo.horas) topGargalo = { nome, horas }; });
            const eficiencia = f.total > 0 ? (f.PRODUTIVO / f.total * 100).toFixed(0) : 0;
            let badgeStyle = '', badgeText = '';
            if (f.IMPRODUTIVO > f.PRODUTIVO) { badgeStyle = 'background:#fee2e2; color:#991b1b'; badgeText = '🔴 CRÍTICA'; }
            else if (f.MANUTENCAO / f.total > 0.25) { badgeStyle = 'background:#ffedd5; color:#9a3412'; badgeText = '⚠️ RISCO MECÂNICO'; }
            else if (eficiencia > 70) { badgeStyle = 'background:#dcfce7; color:#166534'; badgeText = '⭐ ALTA PERFORMANCE'; }
            else { badgeStyle = 'background:#e2e8f0; color:#475569'; badgeText = '⚡ NORMAL'; }
            tableHtml += `<tr><td style="font-weight:800">${f.nome}</td><td style="color:#22c55e">${f.PRODUTIVO.toFixed(1)}h</td><td style="color:#f59e0b">${f.IMPRODUTIVO.toFixed(1)}h</td><td style="color:#ef4444">${f.MANUTENCAO.toFixed(1)}h</td><td style="font-size:12px">${topGargalo.horas > 0 ? `${topGargalo.nome} (${topGargalo.horas.toFixed(1)}h)` : '-'}</td><td><span class="status-badge" style="${badgeStyle}">${badgeText}</span></td></tr>`;
        });
        document.getElementById('table-frentes').innerHTML = tableHtml;
    }
};
window.MatrizPerformanceComponent = MatrizPerformanceComponent;
