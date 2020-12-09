const { Router } = require('express');
const got = require('got');

// Config all process.env variables based on .env
require('dotenv').config();

// Setup Router to define all API calls for this endpoint
const router = Router();

// POST Create an index
router.post('/register', async (req, res, next) => {
  try {
    const response = await got.post('https://aturian.us.auth0.com/oauth/token', {
      json: {
        client_id: req.body.client_id,
        client_secret: req.body.client_secret,
        audience: 'https://aturian-services.aturian.com',
        grant_type: 'client_credentials',
      },
      responseType: 'json',
    });
    res.json(response.body);
  } catch (error) {
    next(error);
  }
});

// Export API
module.exports = router;
