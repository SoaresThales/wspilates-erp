// ---Configurações centralizadas do projeto---

require('dotenv').config();
const path = require('path');

// Debug: verificar se as variáveis foram carregadas
console.log('[CONFIG] DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'UNDEFINED');
console.log('[CONFIG] CERT_PASSWORD:', process.env.CERT_PASSWORD ? '***' : 'UNDEFINED');

module.exports = {
    folders: {
        root: __dirname,
        public: path.join(__dirname, 'public'),
        views: path.join(__dirname, 'views'),
        certificados: path.join(__dirname, 'certificados'),
        recibos: '/home/tsoares/Documentos/wspilates/recibos',
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'ws_pilates_app',
        user: process.env.DB_USER || 'ws_admin',
        password: String(process.env.DB_PASSWORD || ''),
    },
    certificado: {
        path: path.join(__dirname, process.env.CERT_PATH || './certificados/ws_pilates.pfx'),
        password: String(process.env.CERT_PASSWORD || ''),
    },
    pdf: {
        reason: 'Emissão de Comprovante de Pagamento',
        contactInfo: 'contato@wspilates.com.br',
        name: 'WS Pilates',
        location: 'Curitiba, PR',
        signatureLength: 20000,
    },
};