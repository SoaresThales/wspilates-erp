// ---Isolamento do Puppeteer + assinatura digital em PDF---

const puppeteer = require('puppeteer');
const { SignPdf } = require('@signpdf/signpdf');
const { pdflibAddPlaceholder } = require('@signpdf/placeholder-pdf-lib');
const { P12Signer } = require('@signpdf/signer-p12');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function gerarPdfAssinado(htmlContent, certPath, certPassword, pdfConfig) {
    // 1. Gera PDF cru com Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    await page.emulateMediaType('print');
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 2. Adiciona placeholder para assinatura
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdflibAddPlaceholder({
        pdfDoc,
        reason: pdfConfig.reason,
        contactInfo: pdfConfig.contactInfo,
        name: pdfConfig.name,
        location: pdfConfig.location,
        subFilter: 'Adobe.PPKLite',
        signingTime: new Date(),
        signatureLength: pdfConfig.signatureLength,
    });
    const pdfComEspaco = Buffer.from(await pdfDoc.save());

    // 3. Aplica certificado
    const certBuffer = fs.readFileSync(certPath);
    const signer = new P12Signer(certBuffer, { passphrase: certPassword });
    const signPdf = new SignPdf();
    const pdfAssinado = await signPdf.sign(pdfComEspaco, signer);

    return pdfAssinado;
}

module.exports = { gerarPdfAssinado };