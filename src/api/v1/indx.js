const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');

const schema = Joi.object({
  indexName: Joi.string().alphanum().required(),
  primaryKey: Joi.string().required(),
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
router.post('/', async (req, res, next) => {
  try {
    const value = await schema.validateAsync(req.body);
    await client.createIndex(value.indexName, {
      primaryKey: value.primaryKey,
    });
    await client.getIndex(value.indexName).updateAttributesForFaceting([
      'client_id',
      'doc_type',
      'doc_id',
    ]);
    res.json({
      message: `Index: '${value.indexName}' has been created.`,
      index_uid: `${value.indexName}`,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422);
    }
    next(error);
  }
});

// Export API
module.exports = router;
