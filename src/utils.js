const crypto = require('crypto');
const { model } = require('mongoose');
const Token = require('./models/Token');
const Account = require('./models/Account');

async function authenticate(user_id, auth) {
  const hashed_auth = crypto.createHash('sha256').update(auth).digest('hex');
  const token = await Token.findOne({ auth: hashed_auth });
  if (!token) {
    return {valid: false};
  }
  if (token.user_id != user_id) {
    return {valid: false};
  }

  const account = await Account.findById(user_id);
  const username = account.user;

  return {valid: true, username};
}

function not_found(name) {
  return {
    status_code: 'error',
    message: `${name} was not found.`
  }
}

module.exports = { authenticate, not_found };