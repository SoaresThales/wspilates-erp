require('dotenv').config();
const express = require('express');
const path = require('path');
const { setupDatabase } = require('./database/postgres');
const reciboRoutes = require('./routes/reciboRoutes');
const config = require('./config');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(config.folders.public));

app.use('/', reciboRoutes);
app.get('/', (req, res) => {
    res.sendFile(path.join(config.folders.views, 'index.html'));
});

// Inicializa o banco e sobe o servidor (separado em bin/www ou index.js)
setupDatabase().then(() => {
    console.log('Banco de dados pronto');
}).catch(err => {
    console.error('Falha crítica no banco:', err);
    process.exit(1);
});

module.exports = app;