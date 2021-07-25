const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
  mail: {
    type: String,
    required: true
  },
  hashed_pass: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  auth: {
    type: String,
    default: ''
  },
  posts: {
    type: Array,
    default: []
  },
  profile_picture: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Accounts', accountSchema);