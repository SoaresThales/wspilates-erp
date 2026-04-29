// ---Controlador da rota /gerar-comprovante---

const { construirHtmlRecibo } = require('../utils/htmlBuilder');
const { gerarPdfAssinado } = require('../services/pdfGenerator');
const { obterOuCriarCliente, verificarReciboExistente, registrarRecibo } = require('../services/reciboServices');
const { salvarPdf } = require('../utils/fileHelper');
const config = require('../config');

async function gerarComprovante(req, res) {
    try {
        const dados = req.body;
        const { nome, cpf, mesReferencia } = dados;

        if (!nome || !cpf || !mesReferencia) {
            return res.status(400).json({ mensagem: 'Campos obrigatórios (Nome, CPF, Mês) estão faltando.' });
        }

        const clienteId = await obterOuCriarCliente(nome, cpf, dados.plano, dados.frequencia);
        const existe = await verificarReciboExistente(clienteId, mesReferencia);
        if (existe) {
            return res.status(400).json({ error: 'Já existe um comprovante para este aluno neste mês.' });
        }

        const htmlRecibo = await construirHtmlRecibo(dados, {
            public: config.folders.public,
            views: config.folders.views,
        });

        const pdfAssinado = await gerarPdfAssinado(
            htmlRecibo,
            config.certificado.path,
            config.certificado.password,
            config.pdf
        );

        const nomeFormatado = nome.replace(/\s+/g, '_');
        const mesFormatado = mesReferencia.replace('/', '-');
        const nomeArquivo = `Comprovante_${nomeFormatado}_${mesFormatado}.pdf`;
        const caminhoCompleto = salvarPdf(pdfAssinado, config.folders.recibos, nomeArquivo);

        await registrarRecibo(clienteId, mesReferencia, caminhoCompleto);

        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfAssinado);
    } catch (error) {
        console.error('Erro ao gerar comprovante:', error);
        res.status(500).json({ mensagem: 'Erro interno', detalhes: error.message });
    }
}

async function gerarPreview(req, res) {
    try {
        const dadosTeste = {
            nome: 'Thales Soares',
            cpf: '123.456.789-00',
            valor: '150,00',
            formaPagamento: 'Pix',
            data: '25/04/2026',
            mesReferencia: '04/2026',
            frequencia: '2x/semana',
            plano: 'Semestral',
            parcelaAtual: '2',
            totalParcelas: '6',
        };

        const htmlRecibo = await construirHtmlRecibo(dadosTeste, {
            public: config.folders.public,
            views: config.folders.views,
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlRecibo);
    } catch (error) {
        console.error('Erro ao gerar preview:', error);
        res.status(500).json({ mensagem: 'Erro interno ao renderizar preview', detalhes: error.message });
    }
}

module.exports = { gerarComprovante, gerarPreview };