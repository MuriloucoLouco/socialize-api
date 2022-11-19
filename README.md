# socialize-api

A rede social do futuro.

API para ser utilizada em conjunto do [socialize-frontend](https://github.com/MuriloucoLouco/socialize-frontend). Este projeto utiliza mongodb como banco de dados.

## Instalação

- Inicialize um servidor MongoDB
- Crie um arquivo `.env` na pasta raiz do socialize-api contendo `DB_CONNECTION="<seu URL do mongoDB para conexões>"`. Por exemplo: 
`DB_CONNECTION="mongodb://127.0.0.1:27017/socialize"`
- Instale os módulos com `npm install`
- Inicie o servidor: `npm start`