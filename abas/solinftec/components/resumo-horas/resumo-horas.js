const ResumoHorasComponent = {
    render: function(totais) {
        document.getElementById('total-produtivo').innerText = totais.PRODUTIVO.toFixed(1) + 'h';
        document.getElementById('total-improdutivo').innerText = totais.IMPRODUTIVO.toFixed(1) + 'h';
        document.getElementById('total-manutencao').innerText = totais.MANUTENCAO.toFixed(1) + 'h';
    }
};
window.ResumoHorasComponent = ResumoHorasComponent;
