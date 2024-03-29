const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Image = require('../models/Image');
const ProfilePicture = require('../models/ProfilePicture');

const root_dir = require('app-root-path').toString();

router.get('/photos/:image_id', async (req, res) => {
  const image_id = req.params.image_id;
  const image_path = path.join(root_dir, 'static', 'photos', image_id);

  if (fs.existsSync(image_path)) {
    return res.status(200).sendFile(image_path);
  } else {
    try {
      const image = await Image.findById(image_id);

      fs.writeFile(image_path, image.data, (err) => {
        if (err) {
          return res.status(500).json({
            status_code: 'error',
            message: 'Internal server error.'
          });
        } else {
          return res.status(200).sendFile(image_path);
        }
      });
    } catch (err) {
      return res.status(400).json({
        status_code: 'error',
        message: 'Image was not found.'
      });
    }
  }
});

router.get('/profile_pics/:profile_picture_id', async (req, res) => {
  const profile_picture_id = req.params.profile_picture_id;
  const profile_picture_path = path.join(root_dir, 'static', 'profile_pics', profile_picture_id);

  if (fs.existsSync(profile_picture_path)) {
    return res.status(200).sendFile(profile_picture_path);
  } else {
    try {
      const profile_picture = await ProfilePicture.findById(profile_picture_id);

      fs.writeFile(profile_picture_path, profile_picture.data, (err) => {
        if (err) {
          return res.status(500).json({
            status_code: 'error',
            message: 'Internal server error.'
          });
        } else {
          return res.status(200).sendFile(profile_picture_path);
        }
      });
    } catch (err) {
      return res.status(400).json({
        status_code: 'error',
        message: 'Image was not found.'
      });
    }
  }
});

module.exports = router;