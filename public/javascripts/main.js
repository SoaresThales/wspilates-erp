// main.js - versão organizada

// DOM helpers
const getFieldValue = (id) => document.getElementById(id)?.value || '';

// Monta objeto de dados
const getFormData = () => ({
    nome: getFieldValue('nome'),
    cpf: getFieldValue('cpf'),
    valor: getFieldValue('valor'),
    formaPagamento: getFieldValue('forma'),
    data: getFieldValue('data'),
    mesReferencia: getFieldValue('mes_referencia'),
    frequencia: getFieldValue('frequencia'),
    plano: getFieldValue('plano'),
    parcelaAtual: getFieldValue('parcela_atual'),
    totalParcelas: getFieldValue('total_parcelas'),
});

// Requisição para o servidor
async function enviarDados() {
    const dados = getFormData();
    try {
        const response = await fetch('/gerar-comprovante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            const erro = await response.json().catch(() => ({ mensagem: 'Erro desconhecido' }));
            alert(`Falha: ${erro.mensagem || erro.error}`);
            return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Comprovante_${dados.nome.replace(/\s+/g, '')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        alert('Comprovante gerado com sucesso!');
    } catch (error) {
        console.error(error);
        alert('Erro ao comunicar com o servidor.');
    }
}

// Toggle parcelas (evento)
function toggleParcelas() {
    const plano = getFieldValue('plano');
    const div = document.getElementById('campos_parcelas');
    if (div) div.style.display = plano === 'Mensal' ? 'none' : 'block';
}

// Exportar para uso global (se não usar módulos)
window.enviarDados = enviarDados;
window.toggleParcelas = toggleParcelas;