/**
 * configurações globais
 */
require('dotenv').config();
const express = require('express');
const route = require('./app/Router');
const db = require('./app/server/db');

(async () =>{

    /**
     * inicializando o express
     */
    const app = express();

    /**
     * body parser, para trabalhar com JSON
     */
    app.use(express.json());//bodyParser

    /**
     * Adicionando o roteador à instância do aplicativo Express
     */
    app.use('/', route);

    /**
     * Sincroniza o modelo com o banco de dados
     */
    await db.sync({ force: false });
    console.log(`Running database ${process.env.DATABASE_NAME} on port ${process.env.DATABASE_PORT}`)

    /**
     * inicializando o servidor
     */
    await app.listen(process.env.PORT);
    console.log('Express server listening on port %s', process.env.PORT);

})();