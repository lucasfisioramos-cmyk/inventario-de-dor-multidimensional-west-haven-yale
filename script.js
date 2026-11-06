/**
 * WHYMPI (West Haven-Yale Multidimensional Pain Inventory)
 * Motor de Cálculo, Validação, Progresso e Exportação de Relatório Clínico
 * Kerns, Turk & Rudy (1985)
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('whympi-form');
    const btnCalcular = document.getElementById('btn-calcular');
    const btnExportarPdf = document.getElementById('btn-exportar-pdf');
    const btnExportarDocx = document.getElementById('btn-exportar-docx');
    const resultadoContainer = document.getElementById('resultado-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Mapeamento das 12 Subescalas do WHYMPI (0-6)
    const SUBESCALAS = {
        interferencia: { part: 'a', items: [2, 3, 4, 8, 9, 13, 14, 17, 19] },
        apoio: { part: 'a', items: [5] },
        gravidade: { part: 'a', items: [1, 7] },
        autocontrole: { part: 'a', items: [11, 16] },
        animoNegativo: { part: 'a', items: [6, 12, 18, 20] },
        preocupacao: { part: 'a', items: [10, 15] },
        punitivas: { part: 'b', items: [1, 4, 7, 10] },
        solicitas: { part: 'b', items: [2, 5, 8, 11, 13] },
        distracao: { part: 'b', items: [3, 6, 9, 12, 14] },
        domesticas: { part: 'c', items: [1, 9, 13, 17] },
        trabalhoArLivre: { part: 'c', items: [2, 6, 10, 14, 18] },
        foraDeCasa: { part: 'c', items: [3, 5, 7, 11, 15, 16] },
        sociais: { part: 'c', items: [4, 8, 12] }
    };

    // 1. Atualização da Barra de Progresso em Tempo Real
    function atualizarProgresso() {
        const questionBlocks = form.querySelectorAll('.question-block');
        const totalQuestoes = questionBlocks.length; // 52 blocos de perguntas
        let respondidas = 0;

        questionBlocks.forEach(block => {
            const checkedRadio = block.querySelector('input[type="radio"]:checked');
            const checkedBox = block.querySelector('input[type="checkbox"]:checked');
            if (checkedRadio || checkedBox) {
                respondidas++;
            }
        });

        const pct = Math.round((respondidas / totalQuestoes) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressText) progressText.innerText = `${respondidas} de ${totalQuestoes} respondidas (${pct}%)`;
    }

    if (form) {
        form.addEventListener('change', atualizarProgresso);
        form.addEventListener('input', atualizarProgresso);
    }

    // 2. Validação dos Campos Obrigatórios
    function validarFormulario() {
        const pendentes = [];
        const nome = document.getElementById('paciente-nome')?.value.trim();
        const data = document.getElementById('avaliacao-data')?.value;

        if (!nome) pendentes.push('Nome do Paciente');
        if (!data) pendentes.push('Data da Avaliação');

        // Parte A
        for (let i = 1; i <= 20; i++) {
            if (i === 4 && form.querySelector('input[name="q_a_4_nao_aplica"]')?.checked) continue;
            if (i === 14 && form.querySelector('input[name="q_a_14_nao_aplica"]')?.checked) continue;
            if (!form.querySelector(`input[name="q_a_${i}"]:checked`)) {
                pendentes.push(`Parte A - Questão ${i}`);
            }
        }

        // Parte B
        const temOutro = form.querySelector('input[name="outro_significativo"]:checked');
        if (temOutro && temOutro.value !== 'Nenhum') {
            for (let i = 1; i <= 14; i++) {
                if (!form.querySelector(`input[name="q_b_${i}"]:checked`)) {
                    pendentes.push(`Parte B - Questão ${i}`);
                }
            }
        }

        // Parte C
        for (let i = 1; i <= 18; i++) {
            if (!form.querySelector(`input[name="q_c_${i}"]:checked`)) {
                pendentes.push(`Parte C - Questão ${i}`);
            }
        }

        return pendentes;
    }

    function getVal(part, num) {
        const selected = form.querySelector(`input[name="q_${part}_${num}"]:checked`);
        return selected ? parseFloat(selected.value) : null;
    }

    // 3. Cálculo das Subescalas
    function calcularResultados() {
        const resultados = {};
        const naoTrabalhaA4 = form.querySelector('input[name="q_a_4_nao_aplica"]')?.checked;
        const naoTrabalhaA14 = form.querySelector('input[name="q_a_14_nao_aplica"]')?.checked;

        for (const [key, config] of Object.entries(SUBESCALAS)) {
            let soma = 0;
            let count = 0;

            config.items.forEach(num => {
                if (config.part === 'a' && num === 4 && naoTrabalhaA4) return;
                if (config.part === 'a' && num === 14 && naoTrabalhaA14) return;

                const val = getVal(config.part, num);
                if (val !== null) {
                    soma += val;
                    count++;
                }
            });

            resultados[key] = count > 0 ? (soma / count) : 0;
        }

        return resultados;
    }

    // 4. Classificação de Perfil (Turk & Rudy)
    function classificarPerfil(res) {
        const interp = res.interferencia;
        const animo = res.animoNegativo;
        const auto = res.autocontrole;
        const apoio = res.apoio;
        const punitivas = res.punitivas;

        if (interp >= 3.8 && animo >= 3.2 && auto <= 2.8) {
            return {
                perfil: "Perfil Disfuncional (Dysfunctional)",
                cor: "#dc2626",
                descricao: "Altos níveis de dor, incapacidade percebida e sofrimento emocional, acompanhados por baixo sentimento de autocontrole.",
                conduta: "Recomenda-se programa de reabilitação abrangente com foco em estratégias de enfrentamento (coping), graduação de atividade e suporte cognitivo-comportamental."
            };
        } else if (punitivas >= 2.5 || (apoio <= 2.2 && punitivas > 1.8)) {
            return {
                perfil: "Perfil com Estresse Interpessoal (Interpersonally Distressed)",
                cor: "#d97706",
                descricao: "Percepção de que o 'outro significativo' é pouco solícito, crítico ou punitivo em relação às manifestações de dor.",
                conduta: "Indica-se psicoeducação familiar/conjugal e gerenciamento de contingências sociais para conter reforços negativos."
            };
        } else if (auto >= 3.2 && interp <= 3.0 && animo <= 2.8) {
            return {
                perfil: "Perfil Adaptativo (Adaptive Coper)",
                cor: "#16a34a",
                descricao: "Boa capacidade de adaptação, manutenção de níveis adequados de atividade física e social, e elevado autocontrole percebido.",
                conduta: "Foco em condutas ativas, cinesioterapia funcional, autonomia e prevenção de recaídas."
            };
        } else {
            return {
                perfil: "Perfil Atípico / Misto",
                cor: "#4b5563",
                descricao: "Combinação heterogênea de escores que não se enquadra estritamente em um dos três perfis clássicos.",
                conduta: "Analisar as subescalas individualmente para direcionar intervenções personalizadas."
            };
        }
    }

    // 5. Injeção de Dados no Relatório
    function exibirResultados(res, perfilInfo) {
        const nome = document.getElementById('paciente-nome')?.value.trim() || 'Não informado';
        const dataVal = document.getElementById('avaliacao-data')?.value || '';
        
        let dataFormatada = 'Não informado';
        if (dataVal) {
            const partes = dataVal.split('-');
            dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        const outro = form.querySelector('input[name="outro_significativo"]:checked')?.value || 'Não informado';
        const mora = form.querySelector('input[name="mora_junto"]:checked')?.value || 'Não informado';

        const repNome = document.getElementById('rep-paciente-nome');
        const repData = document.getElementById('rep-avaliacao-data');
        const repOutro = document.getElementById('rep-outro-significativo');
        const repMora = document.getElementById('rep-mora-junto');

        if (repNome) repNome.innerText = nome;
        if (repData) repData.innerText = dataFormatada;
        if (repOutro) repOutro.innerText = outro;
        if (repMora) repMora.innerText = mora;

        for (const [key, val] of Object.entries(res)) {
            const el = document.getElementById(`res-${key}`);
            if (el) el.innerText = val.toFixed(2);
        }

        const elPerfil = document.getElementById('perfil-titulo');
        const elDesc = document.getElementById('perfil-desc');
        const elConduta = document.getElementById('perfil-conduta');

        if (elPerfil) {
            elPerfil.innerText = perfilInfo.perfil;
            elPerfil.style.color = perfilInfo.cor;
        }
        if (elDesc) elDesc.innerText = perfilInfo.descricao;
        if (elConduta) elConduta.innerText = perfilInfo.conduta;

        if (resultadoContainer) {
            resultadoContainer.style.display = 'block';
            resultadoContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Clique em Calcular
    if (btnCalcular) {
        btnCalcular.addEventListener('click', (e) => {
            e.preventDefault();
            const pendentes = validarFormulario();
            if (pendentes.length > 0) {
                alert(`Por favor, preencha todos os campos obrigatórios antes de calcular:\n\n- ${pendentes.slice(0, 6).join('\n- ')}${pendentes.length > 6 ? '\n... e outros campos.' : ''}`);
                return;
            }

            const res = calcularResultados();
            const perfil = classificarPerfil(res);
            exibirResultados(res, perfil);
        });
    }

    // 6. Exportação PDF sem Quebra de Bloco
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', () => {
            const nomePaciente = document.getElementById('paciente-nome')?.value.trim() || 'Paciente';
            const dataEval = document.getElementById('avaliacao-data')?.value || new Date().toISOString().slice(0,10);
            const element = document.getElementById('relatorio-impressao');

            if (window.html2pdf && element) {
                const opt = {
                    margin:       [10, 10, 10, 10],
                    filename:     `WHYMPI_${nomePaciente.replace(/\s+/g, '_')}_${dataEval}.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
                };
                html2pdf().set(opt).from(element).save();
            } else {
                window.print();
            }
        });
    }

    // 7. Exportação Word (.doc)
    if (btnExportarDocx) {
        btnExportarDocx.addEventListener('click', () => {
            const nomePaciente = document.getElementById('paciente-nome')?.value.trim() || 'Paciente';
            const element = document.getElementById('relatorio-impressao');
            
            if (!element) return;

            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Relatório WHYMPI</title><style>body{font-family:Arial,sans-serif;padding:20px;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:8px;}</style></head><body>";
            const footer = "</body></html>";
            const sourceHTML = header + element.innerHTML + footer;

            const blob = new Blob(['\ufeff' + sourceHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relatorio_WHYMPI_${nomePaciente.replace(/\s+/g, '_')}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
});