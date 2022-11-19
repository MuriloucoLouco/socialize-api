const mongoose = require('mongoose');

const profilePictureSchema = mongoose.Schema({
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String
  },
  user_id: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('ProfilePictures', profilePictureSchema);