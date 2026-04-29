// ---Salvar arquivo localmente---

const fs = require('fs');
const path = require('path');

function salvarPdf(pdfBuffer, pastaDestino, nomeArquivo) {
    if (!fs.existsSync(pastaDestino)) {
        fs.mkdirSync(pastaDestino, { recursive: true });
    }
    const caminhoCompleto = path.join(pastaDestino, nomeArquivo);
    fs.writeFileSync(caminhoCompleto, pdfBuffer);
    return caminhoCompleto;
}

module.exports = { salvarPdf };