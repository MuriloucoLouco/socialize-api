const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  userid: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: Array,
    default: []
  },
  image_id: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Posts', accountSchema);