const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const validator = require('email-validator');
const Account = require('../models/Account');
const Token = require('../models/Token');

async function generate_auth() {
  const auth = crypto.randomBytes(32).toString('hex');
  return auth;
}

router.post('/register', async (req, res) => {
  const { user, mail, pass } = req.fields;
  const salt = crypto.randomBytes(32).toString('hex');

  if (!(user && mail && pass)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }
  
  if (!validator.validate(mail)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Email is not valid.'
    });
  }
  
  if (user.length > 64 || mail.length > 64 || pass.length > 64) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Parameter too long.'
    });
  }

  const hashed_pass = crypto.createHmac('sha256', salt).update(pass).digest("hex");

  let mail_registered = false;
  await Account.exists({ mail }).then(exists => mail_registered = exists);
  if (mail_registered) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Email is already registered',
    });
  }
  
  const account = new Account({ user, mail, hashed_pass, salt });
  account.save()
  .then(data => {
    res.status(200).json({
      status_code: 'ok',
      message: `Successfully registered email ${mail}` 
    });
  })
  .catch(err => {
    res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  });
});


router.post('/login', async (req, res) => {
  const { mail, pass } = req.fields;

  if (!(mail && pass)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  const account = await Account.findOne({ mail }).exec();

  if (!account) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Email was not found.'
    });
  }

  const hashed_pass = crypto.createHmac('sha256', account.salt).update(pass).digest("hex");
  if (hashed_pass != account.hashed_pass) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Wrong password.'
    });
  }

  const auth = await generate_auth();
  const hashed_auth = crypto.createHash('sha256').update(auth).digest('hex');
  
  const token = new Token({ user_id: account._id, auth: hashed_auth });
  await token.save();

  return res.status(200).json({
    status_code: 'ok',
    username: account.user,
    user_id: account._id,
    message: auth
  });
});


router.post('/logout', async (req, res) => {
  const { auth } = req.fields;

  if (!auth) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  const hashed_auth = crypto.createHash('sha256').update(auth).digest('hex');
  await Token.findOneAndDelete({ auth: hashed_auth })
  .exec().then(token => {
    if (token) {
      return res.status(200).json({
        status_code: 'ok',
        message: 'Sucessfully logged out.'
      });
    } else {
      return res.status(400).json({
        status_code: 'error',
        message: 'Invalid auth.'
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  });
});

module.exports = router;
