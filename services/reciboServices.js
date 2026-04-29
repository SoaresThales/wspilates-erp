// ---Lógica de negócio (clientes, recibos)--- 

const { pool } = require('../database/postgres');

async function obterOuCriarCliente(nome, cpf, plano, frequencia) {
    const result = await pool.query('SELECT id FROM clientes WHERE cpf = $1', [cpf]);
    if (result.rows.length > 0) return result.rows[0].id;

    const insert = await pool.query(
        'INSERT INTO clientes (nome, cpf, plano, frequencia) VALUES ($1, $2, $3, $4) RETURNING id',
        [nome, cpf, plano, frequencia]
    );
    return insert.rows[0].id;
}

async function verificarReciboExistente(clienteId, mesReferencia) {
    const result = await pool.query(
        'SELECT id FROM recibos WHERE cliente_id = $1 AND mes_referencia = $2',
        [clienteId, mesReferencia]
    );
    return result.rows.length > 0;
}

async function registrarRecibo(clienteId, mesReferencia, caminhoArquivo) {
    await pool.query(
        'INSERT INTO recibos (cliente_id, mes_referencia, caminho_arquivo) VALUES ($1, $2, $3)',
        [clienteId, mesReferencia, caminhoArquivo]
    );
}

module.exports = { obterOuCriarCliente, verificarReciboExistente, registrarRecibo };