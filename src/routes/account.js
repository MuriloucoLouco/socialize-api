const mongoose = require('mongoose');
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const validator = require('email-validator');
const Account = require('../models/Account');
const Token = require('../models/Token');
const ProfilePicture = require('../models/ProfilePicture');
const fs = require('fs');
const path = require('path');
const root_dir = require('app-root-path').toString();
const { authenticate, not_found } = require('../utils.js');

const upload_dir = path.join(root_dir, 'static', 'profile_pics');

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

router.post('/profilepicture', async (req, res) => {
  const { auth, user_id } = req.fields;
  const file = req.files.file;

  if (!(auth && user_id && file)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  if (!RegExp('image//*').test(file.type)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Filetype not allowed.'
    });
  }

  const { valid, username } = await authenticate(user_id, auth);
  if (!valid) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Auth code invalid.'
    });
  }

  try {
    const profile_picture = new ProfilePicture({
      data: fs.readFileSync(file.path),
      contentType: file.type,
      user_id: user_id
    });

    await profile_picture.save();
    const profile_picture_id = profile_picture._id.toString();
    await Account.findByIdAndUpdate(user_id, { profile_picture: profile_picture_id });

    fs.copyFileSync(file.path, path.join(upload_dir, profile_picture_id));
    fs.unlinkSync(file.path);

    return res.status(200).json({
      status_code: 'ok',
      profile_picture_id: profile_picture_id
    });
  } catch (err) {
    return res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  }
});

router.get('/profilepicture/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.status(404).json(not_found('User'));
  }

  const account = await Account.findById(user_id);
  if (!account) return res.status(404).json(not_found('User'));

  const profile_picture_id = account.profile_picture;
  if (!profile_picture_id) return res.status(200).sendFile(
    path.join(root_dir, 'static', 'profile_pics', 'profile.jpg')
  );

  return res.redirect('/static/profile_pics/' + profile_picture_id);
});

module.exports = router;
