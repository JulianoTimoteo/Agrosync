        // Aplica o tema salvo o quanto antes, para evitar "flash" de tela clara
        (function () {
            try {
                const salvo = localStorage.getItem('analiseCoaTema');
                if (salvo === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
            } catch (e) { /* localStorage indisponível */ }
            try {
                if (localStorage.getItem('analiseCoaTopMenuCollapsed') === '1') {
                    document.body.classList.add('topmenu-collapsed');
                }
            } catch (e) { /* localStorage indisponível */ }
        })();

        // Alterna a exibição do menu superior (título/badges/botões) e da barra
        // de abas, para dar mais espaço vertical aos gráficos. Estado persiste
        // entre sessões via localStorage, igual ao tema claro/escuro.
        function toggleTopMenu() {
            const collapsed = document.body.classList.toggle('topmenu-collapsed');
            const btn = document.getElementById('btn-menu-toggle');
            if (btn) btn.textContent = collapsed ? '⬇️' : '⬆️';
            try { localStorage.setItem('analiseCoaTopMenuCollapsed', collapsed ? '1' : '0'); } catch (e) { /* localStorage indisponível */ }
        }
        document.addEventListener('DOMContentLoaded', function () {
            const btn = document.getElementById('btn-menu-toggle');
            if (btn) btn.textContent = document.body.classList.contains('topmenu-collapsed') ? '⬇️' : '⬆️';
        });
