# socialize-api

The social network of the future.

API to be used together with [socialize-frontend](https://github.com/MuriloucoLouco/socialize-frontend). This project uses mongodb as database.

## Instalação

- Initialize a MongoDB server
- Create a file `.env` in the socialize-api root folder containing `DB_CONNECTION="<your MongoDB URL>"`. For example: 
`DB_CONNECTION="mongodb://127.0.0.1:27017/socialize"`
- Install the modules with: `npm install`
- Initialize the server: `npm start`