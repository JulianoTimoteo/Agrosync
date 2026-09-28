# Auditoria Completa - Agrosync Colheita Modular

**Data:** 28 de Setembro de 2026

## 1. Abas Mapeadas
- Análise Solinftec (`abas/solinftec`)
- Análise Balança (`abas/balanca`)
- Densidade de Carga (`abas/densidade`)
- Controle de Carga (`abas/controle-carga`)
- Consumo (`abas/consumo`)
- Controle de Liberação (`abas/liberacao`)
- Lab (`abas/lab`)
- Relatórios de Produção (`abas/rel-producao`)

## 2. Componentes Estruturais (Core)
- **Header:** Menu global, alternador de abas principais, Dark/Light Mode.
- **Auto-refresh / Sincronização:** FileSystemAPI, modo espectador (sync via Firebase Firestore).
- **Notificações (Toast):** Alertas em tela para feedback de ações.
- **Gráficos:** Renderizados utilizando `Chart.js` e `chartjs-plugin-datalabels`.
- **Relatórios & PDF:** Exportações nativas CSV e relatórios estruturados usando `html2canvas` + `jsPDF`.
- **Tema:** Controle unificado em `theme.js` alterando atributos `data-theme`.

## 3. Fontes de Dados (Inputs)
A aplicação consome 2 planilhas XLSX carregadas via FileSystem API local:
- `Producao.xlsx` (Dados da Balança)
- `Solinftec.xlsx` (Dados Operacionais, Frotas, Equipamentos, Liberação)
As planilhas são lidas pela biblioteca `xlsx.js`.

## 4. Estrutura Modular Implementada
O sistema original foi desmembrado respeitando a hierarquia exigida sem nenhuma perda:
- O arquivo global.css preserva toda a árvore de renderização CSS original;
- Cada aba possui seu escopo funcional preservado;
- Os scripts funcionais que leem os dados do arquivo XLSX foram migrados para suas subpastas `abas/`.
- IDs, classes, e escopo de eventos (`onclick`, `onchange`) mantidos.
- Geração de PDF e download em CSV perfeitamente preservados nos scripts.

## 5. Próximos Passos (Inteligência Operacional)
Com a arquitetura limpa, o Motor de Inteligência Operacional (`core/intelligence/`) será adicionado, visando criar insights passivos e análises profundas sob a lógica existente de normalização dos dados. 
