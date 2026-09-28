
        function setAutoBannerPrecisaClique(handle) {
            pendingAutoHandle = handle;
            const banner = document.getElementById('auto-load-banner');
            const msgEl = document.getElementById('auto-load-msg');
            const spinner = document.getElementById('auto-load-spinner');
            const dismiss = document.getElementById('auto-load-dismiss');
            banner.style.display = 'flex';
            banner.style.cursor = 'pointer';
            msgEl.textContent = `📂 Última pasta: "${handle.name}" — clique aqui para continuar acessando automaticamente`;
            spinner.style.display = 'none';
            dismiss.style.display = 'none';
            banner.onclick = confirmarAcessoAutomatico;
        }


        async function confirmarAcessoAutomatico() {
            const banner = document.getElementById('auto-load-banner');
            banner.onclick = null;
            banner.style.cursor = 'default';
            const handle = pendingAutoHandle;
            pendingAutoHandle = null;
            const hint = document.getElementById('last-folder-hint');
            if (!handle) return;
            try {
                const perm = await handle.requestPermission({ mode: 'read' });
                if (perm !== 'granted') {
                    dismissAutoBanner();
                    if (hint) hint.style.display = 'none';
                    return;
                }
                await carregarHandleAutomaticamente(handle);
                if (hint) hint.style.display = 'none';
            } catch (err) {
                console.warn('Auto-load (após clique) falhou:', err);
                dismissAutoBanner();
                if (hint) hint.style.display = 'none';
            }
        }


        async function tryAutoLoad() {
            if (!('showDirectoryPicker' in window)) return; // browser não suporta FSA

            const handle = await loadHandle();
            if (!handle) return; // nenhuma pasta salva

            // Mostra dica na upload zone
            const hint = document.getElementById('last-folder-hint');
            if (hint) hint.style.display = 'block';

            try {
                // 1) Tenta silenciosamente primeiro (sem exigir clique) — o navegador
                //    lembra a permissão concedida em usos anteriores no mesmo dia/sessão,
                //    então na maioria dos F5 isso já resolve sozinho.
                const perm = await handle.queryPermission({ mode: 'read' });
                if (perm === 'granted') {
                    await carregarHandleAutomaticamente(handle);
                    if (hint) hint.style.display = 'none';
                    return;
                }
                // 2) Permissão não está mais concedida silenciosamente — o navegador só
                //    reexibe o acesso mediante um gesto do usuário. Pede só 1 clique no
                //    banner (não é preciso reabrir/renavegar a pasta).
                setAutoBannerPrecisaClique(handle);
            } catch (err) {
                console.warn('Auto-load falhou:', err);
                dismissAutoBanner();
                if (hint) hint.style.display = 'none';
            }
        }


        async function selectFolder() {
            espelhoDesligarEspectador(); // seleção manual de pasta = este computador volta a ser "fonte"
            // Tenta File System Access API primeiro (Chrome/Edge ≥ 86)
            if ('showDirectoryPicker' in window) {
                try {
                    const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
                    await saveHandle(dirHandle); // persiste para próxima vez
                    setAutobanner_off();
                    const { producao, solinftec, potencial, metas, name } = await loadFromDirHandle(dirHandle);
                    showDashboard(name);
                    await processFiles(producao, solinftec, potencial, metas);
                    await processConsumoFiles(); // novo módulo CONSUMO
                    espelhoPublicarTudo(name); // publica no Firestore p/ Modo Espectador
                    autoRefreshIniciar(dirHandle, name);
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return; // usuário cancelou
                    console.warn('showDirectoryPicker falhou, usando fallback:', err);
                }
            }

            // Fallback: <input webkitdirectory> (Firefox / contexto sem FSA)
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;
            input.directory = true;
            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (!files.length) return;
                const folderName = files[0].webkitRelativePath.split('/')[0];
                showDashboard(folderName);
                const producaoFile = files.find(f => isProducaoFile(f.name));
                const solinftecFile = files.find(f => isSolinftecFile(f.name));
                const potencialFile = files.find(f => isPotencialFile(f.name));
                const metasFile = files.find(f => isMetasFile(f.name));
                consumoResetArquivos(); // novo módulo CONSUMO
                files.forEach(f => {
                    const tipoConsumo = consumoIdentificarArquivo(f.name);
                    if (tipoConsumo && !consumoArquivos[tipoConsumo]) consumoArquivos[tipoConsumo] = f;
                });
                await processFiles(producaoFile, solinftecFile, potencialFile, metasFile);
                await processConsumoFiles(); // novo módulo CONSUMO
                espelhoPublicarTudo(folderName); // publica no Firestore p/ Modo Espectador
            };
            input.click();
        }


        function setAutobanner_off() {
            const b = document.getElementById('auto-load-banner');
            if (b) b.style.display = 'none';
        }



        function autoRefreshFormatarContagem(segundos) {
            const m = Math.floor(segundos / 60);
            const s = segundos % 60;
            return m + ':' + String(s).padStart(2, '0');
        }



        function autoRefreshAtualizarBadge() {
            const el = document.getElementById('auto-refresh-counter');
            if (!el) return;
            if (!autoRefreshHandleAtual) { el.style.display = 'none'; return; }
            el.style.display = 'inline-flex';
            el.title = 'Clique para atualizar agora · próxima atualização automática em ' + autoRefreshFormatarContagem(autoRefreshSegundosRestantes);
            el.textContent = autoRefreshEmAndamento ? '🔄 Atualizando…' : ('🔄 ' + autoRefreshFormatarContagem(autoRefreshSegundosRestantes));
        }


        async function autoRefreshExecutar(manual) {
            if (!autoRefreshHandleAtual || autoRefreshEmAndamento) return;
            autoRefreshEmAndamento = true;
            autoRefreshAtualizarBadge();
            try {
                let perm = await autoRefreshHandleAtual.queryPermission({ mode: 'read' });
                if (perm !== 'granted') {
                    if (!manual) { autoRefreshEmAndamento = false; autoRefreshAtualizarBadge(); return; }
                    perm = await autoRefreshHandleAtual.requestPermission({ mode: 'read' });
                    if (perm !== 'granted') { autoRefreshEmAndamento = false; autoRefreshAtualizarBadge(); return; }
                }
                const { producao, solinftec, potencial, metas, name } = await loadFromDirHandle(autoRefreshHandleAtual);
                autoRefreshNomeAtual = name;
                await processFiles(producao, solinftec, potencial, metas);
                await processConsumoFiles();
                espelhoPublicarTudo(name);
                if (typeof showToast === 'function') showToast('🔄 Dados atualizados automaticamente', '#16a34a');
            } catch (err) {
                console.warn('Auto-refresh falhou:', err);
            } finally {
                autoRefreshEmAndamento = false;
                autoRefreshSegundosRestantes = AUTO_REFRESH_SEGUNDOS;
                autoRefreshAtualizarBadge();
            }
        }



        function autoRefreshIniciar(handle, nome) {
            autoRefreshHandleAtual = handle;
            autoRefreshNomeAtual = nome || '';
            autoRefreshSegundosRestantes = AUTO_REFRESH_SEGUNDOS;
            autoRefreshAtualizarBadge();
            if (autoRefreshTickTimer) clearInterval(autoRefreshTickTimer);
            autoRefreshTickTimer = setInterval(() => {
                if (!autoRefreshHandleAtual) return;
                autoRefreshSegundosRestantes--;
                if (autoRefreshSegundosRestantes <= 0) autoRefreshExecutar(false);
                else autoRefreshAtualizarBadge();
            }, 1000);
        }



        function autoRefreshForcar() { autoRefreshExecutar(true); }


        async function captureAndCopy() {
            const btn = document.getElementById('btn-screenshot');

            // Captura a aba ativa dentro do dashboardContent
            const activeTab = document.querySelector('.main-tab-content.active');
            const wrapper = document.getElementById('dashboardContent');
            const target = activeTab || wrapper;

            if (!target || (wrapper && wrapper.classList.contains('hidden'))) {
                showToast('⚠️ Carregue os dados antes de capturar', '#dc2626');
                return;
            }

            btn.classList.add('capturing');
            btn.textContent = '⏳ Capturando…';

            // Oculta tabelas Detalhamento (caminhão e colhedoras) durante o screenshot
            const tabelasDetalhamento = target.querySelectorAll('#consumo-caminhao-tabela, #consumo-colhedoras-tabela');
            tabelasDetalhamento.forEach(el => el.style.display = 'none');

            // Força os gráficos a redesenhar no tamanho atual antes de capturar —
            // evita que o canvas fique com pixels de uma renderização antiga,
            // que aparece "estourando" a borda do card na imagem capturada.
            Object.values(charts).forEach(c => { try { c && c.resize(); } catch (e) { /* ignora */ } });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            // Guardado fora do try para o fallback de download poder usar mesmo
            // se o clipboard falhar (ver catch abaixo).
            let capturedBlob = null;

            try {
                // ── renderiza com html2canvas ──────────────────────────
                const rect = target.getBoundingClientRect();
                const targetW = Math.min(rect.width || target.scrollWidth, 1920);
                const targetH = target.scrollHeight || rect.height;
                const canvas = await html2canvas(target, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    width: targetW,
                    height: targetH,
                    windowWidth: targetW,
                    windowHeight: targetH,
                    scrollX: 0,
                    scrollY: -window.scrollY
                });

                const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
                capturedBlob = blob;

                // ── tenta Clipboard API moderna ────────────────────────
                let copied = false;
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    copied = true;
                } catch (_) { /* bloqueado por permissions-policy */ }

                if (copied) {
                    showToast('📋 Copiado! Cole no WhatsApp com Ctrl+V', '#16a34a');
                    return;
                }

                // ── fallback: img em contenteditable + execCommand ─────
                const url = URL.createObjectURL(blob);
                const img = new Image();

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });

                // Div invisível fora da tela com a imagem
                const div = document.createElement('div');
                div.setAttribute('contenteditable', 'true');
                Object.assign(div.style, {
                    position: 'fixed', left: '-9999px', top: '0',
                    opacity: '0', pointerEvents: 'none'
                });
                div.appendChild(img);
                document.body.appendChild(div);

                // Seleciona e copia
                const range = document.createRange();
                range.selectNodeContents(div);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                const ok = document.execCommand('copy');
                sel.removeAllRanges();
                document.body.removeChild(div);
                URL.revokeObjectURL(url);

                if (ok) {
                    showToast('📋 Copiado! Cole no WhatsApp com Ctrl+V', '#16a34a');
                } else {
                    throw new Error('execCommand falhou');
                }

            } catch (err) {
                console.warn('Captura:', err);
                // Clipboard API e execCommand('copy') exigem contexto de navegador de
                // topo — ambos são bloqueados por permissions-policy quando a página
                // roda dentro de um <iframe> (ex.: pré-visualização/sandbox), mesmo
                // fora desse caso, se o navegador simplesmente negar a permissão. Como
                // a imagem já foi gerada com sucesso pelo html2canvas antes de falhar
                // a cópia, em vez de descartá-la baixamos o PNG automaticamente — o
                // usuário ainda sai com o arquivo, só precisa colar manualmente.
                if (capturedBlob) {
                    try {
                        const dlUrl = URL.createObjectURL(capturedBlob);
                        const a = document.createElement('a');
                        a.href = dlUrl;
                        a.download = 'analise-coa-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.png';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(dlUrl), 4000);
                        showToast('📥 Não foi possível copiar (bloqueado pelo navegador) — imagem baixada em vez disso.', '#f59e0b');
                    } catch (dlErr) {
                        console.warn('Fallback de download também falhou:', dlErr);
                        showToast('❌ Permissão negada. Abra o HTML direto no navegador (não em iframe).', '#dc2626');
                    }
                } else {
                    showToast('❌ Permissão negada. Abra o HTML direto no navegador (não em iframe).', '#dc2626');
                }
            } finally {
                tabelasDetalhamento.forEach(el => el.style.display = '');
                btn.classList.remove('capturing');
                btn.innerHTML = '📸 CAPTURAR TELA';
            }
        }

