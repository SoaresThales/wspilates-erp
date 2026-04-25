async function enviarDados() {
    // Função auxiliar para evitar o erro caso o campo não exista no HTML
    const safeGetValue = (id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Aviso: O campo com id='${id}' não foi encontrado no HTML.`);
            return '';
        }
        return element.value;
    };

    const dados = {
        nome: safeGetValue('nome'),
        cpf: safeGetValue('cpf'),
        valor: safeGetValue('valor'),
        formaPagamento: safeGetValue('forma'),
        data: safeGetValue('data'),
        mesReferencia: safeGetValue('mes_referencia'),
        frequencia: safeGetValue('frequencia'),
        plano: safeGetValue('plano'),
        parcelaAtual: safeGetValue('parcela_atual'),
        totalParcelas: safeGetValue('total_parcelas')
    };

    try {
        const response = await fetch('/gerar-comprovante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        // Se o servidor retornar o erro 400 (duplicado), mostramos um alerta
        if (!response.ok) {
            let msgErro = 'Erro desconhecido no servidor.';
            try {
                const erroJson = await response.json();
                msgErro = erroJson.mensagem || erroJson.error;
            } catch (e) {
                // Caso o erro não seja um JSON (erro 500 bruto do Express)
                msgErro = `Erro ${response.status}: Verifique o terminal do Node.js`;
            }
            alert('Falha: ' + msgErro);
            return;
        }

        // Se deu tudo certo, pega o PDF gerado e força o download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Comprovante_${dados.nome.replace(/\s+/g, '')}.pdf`;
        a.click();

        alert('Comprovante gerado com sucesso e salvo no sistema!');
        
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Falha ao comunicar com o servidor.');
    }
}