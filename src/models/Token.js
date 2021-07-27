const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
  auth: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Tokens', tokenSchema);