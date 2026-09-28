const PioresFrentesComponent = {
    render: function(frentesData) {
        const frentesArray = Object.entries(frentesData).map(([nome, data]) => ({ nome, ...data }));
        const piores = [...frentesArray].sort((a, b) => b.IMPRODUTIVO - a.IMPRODUTIVO).slice(0, 5);
        const maxImprod = piores[0]?.IMPRODUTIVO || 1;
        document.getElementById('piores-frentes').innerHTML = piores.map((f, i) => `<div class="rank-item"><div class="rank-pos">${i + 1}</div><div class="rank-name">${f.nome}</div><div class="rank-bar"><div class="rank-bar-fill" style="width: ${(f.IMPRODUTIVO / maxImprod) * 100}%;"></div></div><div class="rank-value">${f.IMPRODUTIVO.toFixed(1)}h</div></div>`).join('') || '<div>Nenhum dado</div>';
    }
};
window.PioresFrentesComponent = PioresFrentesComponent;
