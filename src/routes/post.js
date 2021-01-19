const mongoose = require('mongoose');
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Account = require('../models/Account');
const Post = require('../models/Post');
const { route } = require('./account');

function not_found(name) {
  return {
    status_code: 'error',
    message: `${name} was not found.`
  }
}

router.post('/create', async (req, res) => {
  const { title, text, auth } = req.body;

  if (!(title && text && auth)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  const account = await Account.findOne({ auth }).exec();
  if (!account) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Auth code invalid.'
    });
  }
  const userid = account._id.toString();
  const username = account.user;

  const post = new Post({ title, text, username, userid });
  post.save()
  .then(data => {
    res.status(200).json({
      status_code: 'ok',
      message: post._id
    });
  })
  .catch(err => {
    res.status(500).json({
      status_code: 'error',
      message: 'Internal server error.'
    });
  });

  await Account.findOneAndUpdate({ auth }, {
    $push: {posts: post._id.toString()}
  });
});


router.post('/comment/:postid', async (req, res) => {
  const { text, auth } = req.body;
  const postid = req.params.postid;

  if (!(text && auth)) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Missing parameters.'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(postid)) {
    return res.status(400).json(not_found('Post'));
  }


  const account = await Account.findOne({ auth }).exec();
  if (!account) {
    return res.status(400).json({
      status_code: 'error',
      message: 'Auth code invalid.'
    });
  }
  const userid = account._id.toString();
  const username = account.user;

  const post = await Post.findByIdAndUpdate(postid, {
    $push: {
      comments: {
        $each: [{username, userid, text}],
        $position: 0
      }
    }
  });
  if (!post) {
    return res.status(400).json(not_found('Post'));
  }

  return res.status(200).json({
    status_code: 'ok',
    message: postid
  });
});


router.get('/all', async (req, res) => {
  const posts = await Post.find({}).sort({ date: -1 });
  res.status(200).json(posts);
});


router.get('/user/:userid', async (req, res) => {
  const userid = req.params.userid;

  if (!mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json(not_found('User'));
  }

  const account = await Account.findById(userid);
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


router.get('/id/:postid', async (req, res) => {
  const postid = req.params.postid;

  if (!mongoose.Types.ObjectId.isValid(postid)) {
    return res.status(400).json(not_found('Post'));
  }

  try {
    const post = await Post.findById(postid);
    return res.status(200).json({
      status_code: 'ok',
      ...post.toObject()
    });
  } catch (err) {
    return res.status(400).json(not_found('Post'));
  }
});

module.exports = router;