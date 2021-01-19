const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3333;
const account_router = require('./routes/account.js');
const post_router = require('./routes/post.js');
require('dotenv/config');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use('/account', account_router);
app.use('/post', post_router);
app.get('/', (req, res) => res.send('Não tem nada aqui, amigão'));

mongoose.connect(process.env.DB_CONNECTION,
  {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}, () => {
  console.log('Conectado ao banco de dados.');
});

app.listen(port, () => {
  console.log(`API rodando em: http://localhost:${port}`);
});
