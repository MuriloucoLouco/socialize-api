const mongoose = require('mongoose');
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Account = require('../models/Account');
const Post = require('../models/Post');
const Image = require('../models/Image');
const fs = require('fs');
const path = require('path');
const root_dir = require('app-root-path').toString();
const { authenticate, not_found } = require('../utils.js');

const upload_dir = path.join(root_dir, 'static', 'photos');

router.post('/create', async (req, res) => {
  const { title, text, auth, user_id } = req.fields;
  const file = req.files.file;

  if (!(title && text && auth && user_id)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  if (file && !RegExp('image//*').test(file.type)) {
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

  let image_id;
  try {
    if (file) {
      const image = new Image({
        data: fs.readFileSync(file.path),
        contentType: file.type
      });
      await image.save();
      image_id = image._id.toString();
      fs.copyFileSync(file.path, path.join(upload_dir, image_id));
      fs.unlinkSync(file.path);
    }
  } catch (err) {
    return res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  }

  const post = new Post({ title, text, username, user_id, image_id });
  post.save()
  .then(async data => {
    await Account.findByIdAndUpdate(user_id, {
      $push: {posts: post._id.toString()}
    });
    res.status(200).json({
      status_code: 'ok',
      message: post._id
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  });
});


router.post('/comment/:post_id', async (req, res) => {
  const { text, auth, user_id } = req.fields;
  const post_id = req.params.post_id;

  if (!(text && auth && user_id)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    return res.status(400).json(not_found('Post'));
  }

  const { valid, username } = await authenticate(user_id, auth);
  if (!valid) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Auth code invalid.'
    });
  }

  const post = await Post.findByIdAndUpdate(post_id, {
    $push: {
      comments: {
        $each: [{username, user_id, text}],
        $position: 0
      }
    }
  });
  if (!post) {
    return res.status(400).json(not_found('Post'));
  }

  return res.status(200).json({
    status_code: 'ok',
    message: post_id
  });
});


router.get('/all', async (req, res) => {
  const posts = await Post.find({}).sort({ date: -1 });
  res.status(200).json(posts);
});


router.get('/user/:user_id', async (req, res) => {
  const user_id = req.params.user_id;

  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.status(400).json(not_found('User'));
  }

  const account = await Account.findById(user_id);
  if (account) {
    const posts_id = account.posts;
    const posts = [];
    for (let i = 0; i < posts_id.length; i++) {
      const post = await Post.findById(posts_id[i]);
      posts.unshift(post);
    }
    return res.status(200).json({
      status_code: 'ok',
      name: account.user,
      posts: posts
    });
  } else {
    return res.status(400).json(not_found('User'));
  }
});


router.get('/id/:post_id', async (req, res) => {
  const post_id = req.params.post_id;

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    return res.status(400).json(not_found('Post'));
  }

  try {
    const post = await Post.findById(post_id);
    return res.status(200).json({
      status_code: 'ok',
      ...post.toObject()
    });
  } catch (err) {
    return res.status(400).json(not_found('Post'));
  }
});

module.exports = router;