// ---Configurações Centrais do Sistema---

const path = require('path');
require('dotenv').config();

module.exports = {
    // Servidor
    port: process.env.PORT || 3000,

    // Banco de dados (valores padrão para desenvolvimento)
    db: {
        user: process.env.DB_USER || 'ws_admin',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'ws_pilates_app',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    },

    // Certificado digital
    cert: {
        path: path.join(__dirname, '../', process.env.CERT_PATH || 'certificados/ws_pilates.pfx'),
        password: process.env.CERT_PASSWORD,
    },

    // Pastas do sistema
    folders: {
        recibos: process.env.RECIBOS_PATH || '/home/tsoares/Documentos/wspilates/recibos',
        public: path.join(__dirname, '../public'),
        views: path.join(__dirname, '../views'),
    },

    // Configurações do PDF
    pdf: {
        reason: 'Emissão de Comprovante de Pagamento',
        contactInfo: 'contato@wspilates.com.br',
        name: 'WS Pilates',
        location: 'Curitiba, PR',
        signatureLength: 20000,
    }
};