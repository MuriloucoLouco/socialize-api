const mongoose = require('mongoose');

const imageSchema = mongoose.Schema({
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String
  }
});

module.exports = mongoose.model('Images', imageSchema);