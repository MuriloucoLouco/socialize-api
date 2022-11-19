const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3333;
const account_router = require('./routes/account.js');
const post_router = require('./routes/post.js');
const static_router = require('./routes/static.js');
const formidableMiddleware = require('express-formidable');

require('dotenv/config');

app.use(formidableMiddleware(
  { maxFileSize: 5 * 1024 * 1024 },
  [{ event: 'error', action: (req, res, next, err) => {
    return res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  }}]
));
app.use(cors());

app.use('/account', account_router);
app.use('/post', post_router);
app.use('/static', static_router);
app.get('/', (req, res) => res.send('Não tem nada aqui, amigão'));

mongoose.set('useFindAndModify', false);

mongoose.connect(process.env.DB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Conectado ao banco de dados.')
})
.catch(error => {
  console.log("Erro ao conectar no banco de dados: ", error);
});

app.listen(port, () => {
  console.log(`API rodando em: http://localhost:${port}`);
});
