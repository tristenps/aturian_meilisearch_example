const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');

const middlewares = require('../../middlewares.js');

const schema = Joi.object({
  client_id: Joi.string().alphanum().required(),
});

// Config all process.env variables based on .env
require('dotenv').config();

// Connect to MeiliSearch client
const client = new MeiliSearch({
  host: process.env.MEILI_DOCKER_URL,
});

// Setup Router to define all API calls for this endpoint
const router = Router();

// GET all indexes
router.get('/', async (req, res, next) => {
  try {
    const indexes = await client.listIndexes();
    res.send(indexes);
  } catch (error) {
    next(error);
  }
});

// POST Create an index
router.post('/', middlewares.checkJwt, middlewares.meiliAccess, async (req, res, next) => {
  try {
    const value = await schema.validateAsync(req.body);
    await client.createIndex(value.client_id, {
      primaryKey: 'doc_id',
    });
    // TODO: Create definitive list of faceted attributes
    await client.getIndex(value.client_id).updateAttributesForFaceting([
      'client_id',
      'doc_type',
      'doc_id',
    ]);
    res.json({
      message: `Index: '${value.client_id}' has been created.`,
      index_uid: `${value.client_id}`,
      primary_key: 'doc_id',
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(409);
    }
    next(error);
  }
});

// Export API
module.exports = router;
