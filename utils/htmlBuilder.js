// ---Montagem do HTML do recibo---

const fs = require('fs');
const path = require('path');

function carregarImagemBase64(caminhoAbsoluto) {
    if (fs.existsSync(caminhoAbsoluto)) {
        const buffer = fs.readFileSync(caminhoAbsoluto);
        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    return '';
}

function carregarCss(caminhoCss) {
    if (fs.existsSync(caminhoCss)) {
        return fs.readFileSync(caminhoCss, 'utf8');
    }
    return '';
}

async function construirHtmlRecibo(dados, configPaths) {
    const { nome, cpf, valor, formaPagamento, data, mesReferencia, frequencia, plano, parcelaAtual, totalParcelas } = dados;

    const infoPlano = plano !== 'Mensal' ? `${plano} (${parcelaAtual}/${totalParcelas})` : plano;

    const logoDataUri = carregarImagemBase64(path.join(configPaths.public, 'images', 'logo.png'));
    const assinaturaDataUri = carregarImagemBase64(path.join(configPaths.public, 'images', 'signature.png'));
    const cssContent = carregarCss(path.join(configPaths.public, 'stylesheets', 'estilo_recibo.css'));

    let template = fs.readFileSync(path.join(configPaths.views, 'template_recibo.html'), 'utf8');

    const substituicoes = {
        '<<LOGO_BASE64>>': logoDataUri,
        '<<ASSINATURA_BASE64>>': assinaturaDataUri,
        '<<NOME>>': nome,
        '<<CPF>>': cpf,
        '<<VALOR>>': valor,
        '<<FORMA_PAGAMENTO>>': formaPagamento,
        '<<DATA>>': data,
        '<<MES_REFERENCIA>>': mesReferencia,
        '<<FREQUENCIA>>': frequencia,
        '<<INFO_PLANO>>': infoPlano,
    };

    for (const [placeholder, valorReal] of Object.entries(substituicoes)) {
        template = template.replace(new RegExp(placeholder, 'g'), valorReal);
    }

    // Injeta o CSS dentro do <head> do HTML
    template = template.replace('</head>', `<style>${cssContent}</style></head>`);

    return template;
}

module.exports = { construirHtmlRecibo };