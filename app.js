require('dotenv').config(); // Carrega variáveis de ambiente antes de qualquer coisa
const { SignPdf } = require('@signpdf/signpdf');
const { pdflibAddPlaceholder } = require('@signpdf/placeholder-pdf-lib');
const { P12Signer } = require('@signpdf/signer-p12');
const { PDFDocument } = require('pdf-lib'); // Importação que faltava
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { Pool } = require('pg');

// Configura a conexão com o Docker
const pool = new Pool({
    user: 'ws_admin',
    host: 'localhost',
    database: 'ws_pilates_app',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// Inicializa as tabelas do PostgreSQL automaticamente
async function setupDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                cpf VARCHAR(14) UNIQUE NOT NULL,
                telefone VARCHAR(20),
                status VARCHAR(20) DEFAULT 'Ativo',
                plano VARCHAR(50),
                frequencia VARCHAR(50),
                dia_vencimento INTEGER DEFAULT 10,
                valor_mensalidade DECIMAL(10, 2)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS recibos (
                id SERIAL PRIMARY KEY,
                cliente_id INTEGER REFERENCES clientes(id),
                mes_referencia VARCHAR(10) NOT NULL,
                data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status_envio VARCHAR(50) DEFAULT 'Pendente',
                caminho_arquivo VARCHAR(255)
            )
        `);
        console.log('Banco de dados PostgreSQL conectado e tabelas sincronizadas.');
    } catch (error) {
        console.error('Erro ao configurar o PostgreSQL:', error);
    }
}
setupDatabase();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura o Express para servir os arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));


// Rota que entrega o HTML principal - acesso via raiz (localhost:3000)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Endpoint principal: recebe dados do formulário, valida, gera PDF e assina digitalmente
app.post('/gerar-comprovante', async (req, res) => {
    try {
        const { nome, cpf, valor, formaPagamento, data, mesReferencia, frequencia, plano, parcelaAtual, totalParcelas } = req.body;

        // Validação mínima - evita que o replace falle por campos undefined
        if (!nome || !cpf || !mesReferencia) {
            return res.status(400).json({ mensagem: 'Campos obrigatórios (Nome, CPF, Mês) estão faltando.' });
        }

        // 1. Verifica se o aluno já existe no banco
        let clienteResult = await pool.query('SELECT id FROM clientes WHERE cpf = $1', [cpf]);
        let clienteId;

        if (clienteResult.rows.length === 0) {
            // Se o aluno não existe, cria o cadastro dele na hora com os dados do formulário
            const insertCliente = await pool.query(
                'INSERT INTO clientes (nome, cpf, plano, frequencia) VALUES ($1, $2, $3, $4) RETURNING id',
                [nome, cpf, plano, frequencia]
            );
            clienteId = insertCliente.rows[0].id;
        } else {
            clienteId = clienteResult.rows[0].id;
        }

        // 2. Verifica se o recibo já foi gerado para este aluno neste mês
        const reciboExistente = await pool.query(
            'SELECT id FROM recibos WHERE cliente_id = $1 AND mes_referencia = $2',
            [clienteId, mesReferencia]
        );

        if (reciboExistente.rows.length > 0) {
            return res.status(400).json({ error: 'Já existe um comprovante gerado para este aluno neste mês.' });
        }

        // Formata info do plano: mensal não precisa de parcela, outros planos mostram progresso (ex: 2/6)
        let infoPlano = plano; 
        
        // Se for diferente de Mensal, nós concatenamos as parcelas (ex: "Semestral (2/6)")
        if (plano !== 'Mensal') {
            infoPlano = `${plano} (${parcelaAtual}/${totalParcelas})`;
        }

        // Carrega logo em base64 para injetar diretamente no HTML
        const caminhoLogo = path.join(__dirname, 'public', 'images', 'logo.png');
        let logoDataUri = '';
        if (fs.existsSync(caminhoLogo)) {
            const logoBase64 = fs.readFileSync(caminhoLogo).toString('base64');
            logoDataUri = `data:image/png;base64,${logoBase64}`;
        }

        // Carrega assinatura digitalizada - útil para visualização no template
        const caminhoAssinatura = path.join(__dirname, 'public', 'images', 'signature.png');
        let assinaturaBase64 = '';
        if (fs.existsSync(caminhoAssinatura)) {
            const assinaturaBuffer = fs.readFileSync(caminhoAssinatura);
            assinaturaBase64 = `data:image/png;base64,${assinaturaBuffer.toString('base64')}`;
            console.log('DEBUG - Assinatura carregada:', {
                path: caminhoAssinatura,
                size: assinaturaBuffer.length,
                base64Length: assinaturaBase64.length,
                prefix: assinaturaBase64.substring(0, 30)
            });
        } else {
            console.log('DEBUG - Arquivo de assinatura não encontrado:', caminhoAssinatura);
        }

        const caminhoTemplate = path.join(__dirname, 'views', 'template_recibo.html');
        let htmlTemplate = fs.readFileSync(caminhoTemplate, 'utf8');

        // Substitui todos os placeholders do template HTML pelos dados reais
        htmlTemplate = htmlTemplate.replace(/<<LOGO_BASE64>>/g, logoDataUri)
                                   .replace(/<<ASSINATURA_BASE64>>/g, assinaturaBase64)
                                   .replace(/<<NOME>>/g, nome)
                                   .replace(/<<CPF>>/g, cpf)
                                   .replace(/<<VALOR>>/g, valor)
                                   .replace(/<<FORMA_PAGAMENTO>>/g, formaPagamento)
                                   .replace(/<<DATA>>/g, data)
                                   .replace(/<<MES_REFERENCIA>>/g, mesReferencia)
                                   .replace(/<<FREQUENCIA>>/g, frequencia)
                                   .replace(/<<INFO_PLANO>>/g, infoPlano);

   // Gera PDF a partir do HTML renderizado - modo print remove elementos interativos
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlTemplate);
        await page.addStyleTag({ path: path.join(__dirname, 'public', 'estilo_recibo.css') });
        await page.emulateMediaType('print'); 
        
        const pdfBufferCru = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            displayHeaderFooter: false 
        });
        await browser.close();

        // Prepara área para assinatura digital usando pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBufferCru);
        
        pdflibAddPlaceholder({
            pdfDoc,
            reason: 'Emissão de Comprovante de Pagamento',
            contactInfo: 'contato@wspilates.com.br',
            name: 'WS Pilates',
            location: 'Curitiba, PR',
            subFilter: 'Adobe.PPKLite',
            signingTime: new Date(),
            signatureLength: 20000
        });
        
        console.log('DEBUG - Placeholder adicionado ao PDF');
        
        // Converte bytes do pdf-lib para Buffer nativo do Node
        const pdfBytes = await pdfDoc.save();
        const pdfComEspacoParaAssinatura = Buffer.from(pdfBytes);

        // Aplica certificado digital PFX - documento final terá valor legal
        const caminhoCertificado = path.join(__dirname, process.env.CERT_PATH);
        if (!fs.existsSync(caminhoCertificado)) {
            throw new Error(`Arquivo de certificado não encontrado em: ${caminhoCertificado}`);
        }

        const certificadoBuffer = fs.readFileSync(caminhoCertificado);
        
        const senhaCertificado = process.env.CERT_PASSWORD; 
        if (!senhaCertificado) {
            throw new Error('A senha do certificado não foi encontrada no arquivo .env!');
        }

        // Lê certificado do sistema de arquivos - caminho configurado acima
        const credencialP12 = new P12Signer(certificadoBuffer, { passphrase: senhaCertificado });

        // Inicializa motor de assinatura - sem isso o signpdf não funciona
        const motorAssinatura = new SignPdf();

        // Executa assinatura digital - resultado é PDF com certificado嵌入
        const pdfAssinado = await motorAssinatura.sign(pdfComEspacoParaAssinatura, credencialP12);

        // Salva arquivo localmente - caminho fixo na pasta Documentos do usuário
        const pastaDestino = '/home/tsoares/Documentos/wspilates/recibos';
        if (!fs.existsSync(pastaDestino)) {
            fs.mkdirSync(pastaDestino, { recursive: true });
        }
        
        const nomeFormatado = nome.replace(/\s+/g, '_');
        const mesFormatado = mesReferencia.replace('/', '-');
        const nomeArquivo = `Comprovante_${nomeFormatado}_${mesFormatado}.pdf`;
        
        const caminhoCompleto = path.join(pastaDestino, nomeArquivo);
        fs.writeFileSync(caminhoCompleto, pdfAssinado);
        
        // Registra geração para controle e evitar duplicatas futuras
        await pool.query(
            'INSERT INTO recibos (cliente_id, mes_referencia, caminho_arquivo) VALUES ($1, $2, $3)',
            [clienteId, mesReferencia, caminhoCompleto]
        );

        // Retorna PDF assinado diretamente no corpo da resposta
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfAssinado); // Envia o documento final assinado
    } catch (error) {
        console.error('Erro ao gerar o comprovante:', error);
        // Debug: mostra mensagem real do erro para facilitar troubleshooting
        res.status(500).json({ mensagem: 'Erro interno:', detalhes: error.message });
    }
});

// Rota de desenvolvimento: renderiza HTML com dados mockados para teste visual
app.get('/preview', (req, res) => {
    try {
        // Converte logo para data URI - permite exibir sem necessidade de arquivo externo
        const caminhoLogo = path.join(__dirname, 'public', 'images', 'logo.png');
        let logoDataUri = '';
        
        // Log de warning se a logo não existir - evita surpresa na hora de gerar PDF
        if (fs.existsSync(caminhoLogo)) {
            const logoBase64 = fs.readFileSync(caminhoLogo).toString('base64');
            logoDataUri = `data:image/png;base64,${logoBase64}`;
        } else {
            console.log('AVISO: A logo não foi encontrada no caminho:', caminhoLogo);
        }

        // Lê template HTML e CSS do sistema de arquivos
        const caminhoTemplate = path.join(__dirname, 'views', 'template_recibo.html'); // Verifique se este é o nome do seu arquivo
        let htmlTemplate = fs.readFileSync(caminhoTemplate, 'utf8');

        const caminhoCss = path.join(__dirname, 'public', 'estilo_recibo.css');
        const css = fs.readFileSync(caminhoCss, 'utf8');

        // Substitui placeholders com dados de teste - útil para validar layout
        htmlTemplate = htmlTemplate.replace(/<<LOGO_BASE64>>/g, logoDataUri) // Garanta que logoDataUri não esteja vazio
                                   .replace(/<<NOME>>/g, 'Thales Soares')
                                   .replace(/<<CPF>>/g, '123.456.789-00')
                                   .replace(/<<VALOR>>/g, '150,00')
                                   .replace(/<<FORMA_PAGAMENTO>>/g, 'Pix')
                                   .replace(/<<DATA>>/g, '22/04/2026')
                                   .replace(/<<MES_REFERENCIA>>/g, '04/2026')
                                   .replace(/<<FREQUENCIA>>/g, '2x/semana') 
                                   .replace(/<<INFO_PLANO>>/g, 'Semestral (2/6)');

        // Injeta CSS inline no head - garante estilo mesmo sem servidor de assets
        const htmlComCss = htmlTemplate.replace('</head>', `<style>${css}</style></head>`);

        // Envia HTML renderizado - navegador interpreta como página normal
        res.send(htmlComCss);

    } catch (erro) {
        console.error('Erro ao gerar o preview:', erro);
        res.status(500).send('Erro interno ao tentar renderizar o preview.');
    }
});

module.exports = app;