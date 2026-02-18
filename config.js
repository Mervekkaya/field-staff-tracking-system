const express = require('express');
const router = express.Router();
const config = require('../config/config');

router.get('/google-maps-key', (req, res) => {
  res.json({ apiKey: config.googleMapsApiKey });
});

module.exports = router;
