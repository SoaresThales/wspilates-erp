// ---Conexão e Inicialização do PostgreSQL---

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.database);

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
        console.log('PostgreSQL conectado e tabelas prontas.');
    } catch (error) {
        console.error('Erro ao configurar banco:', error);
        throw error;
    }
}

module.exports = { pool, setupDatabase };