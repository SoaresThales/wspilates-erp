// ---Definição de rotas para geração de recibos---

const express = require('express');
const { gerarComprovante, gerarPreview } = require('../controllers/reciboController');
const router = express.Router();

router.post('/gerar-comprovante', gerarComprovante);
router.get('/preview', gerarPreview);

module.exports = router;