const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');
const crypto = require('crypto');

const middlewares = require('../../middlewares.js');

// Define validation Schema
const searchSchema = Joi.object({
  client_id: Joi.string().alphanum().required(),
  searchParams: Joi.object({
    query: Joi.string().allow('').required(),
    offset: Joi.number(),
    limit: Joi.number(),
    filters: Joi.string(),
    facetFilters: Joi.array().items(Joi.string()),
  }),
});

// Config all process.env values
require('dotenv').config();

const salt = process.env.SALT || '';

// Connect to MeiliSearch Client
const client = new MeiliSearch({
  host: process.env.MEILI_DOCKER_URL,
  apiKey: process.env.MEILI_MASTER_KEY,
});

// Creeate Router to assign APIs
const router = Router();

// GET search request for a specific indexes documents
//
router.get('/search', middlewares.checkJwt, middlewares.meiliAccess, async (req, res, next) => {
  try {
    const value = await searchSchema.validateAsync(req.body);
    const q = value.searchParams.query;
    const lowerClientId = value.client_id.toLowerCase();
    const hashClientId = crypto.createHash('sha1').update(lowerClientId + salt).digest('hex');
    const searchParams = {
      offset: value.searchParams.offset || 0,
      limit: value.searchParams.limit || 50,
      filters: value.searchParams.filters || null,
      facetFilters: value.searchParams.facetFilters || null,
      attributesToRetrieve: ['*'],
      matches: true,
    };
    const searchResults = await client.getIndex(hashClientId).search(q, searchParams);
    res.send(searchResults);
  } catch (error) {
    next(error);
  }
});

// POST search for instantSearch
router.post('/instantSearch/indexes/:client_id/search', async (req, res, next) => {
  try {
    const hashClientId = crypto.createHash('sha1').update('demo'.toLowerCase() + salt).digest('hex');
    if (hashClientId === req.params.client_id) {
      const {
        q,
        limit,
        facetsDistribution,
        attributesToCrop,
        attributesToHighlight,
      } = req.body;
      const searchResults = await client.getIndex(hashClientId).search(q, {
        limit, facetsDistribution, attributesToCrop, attributesToHighlight,
      });
      res.send(searchResults);
    } else {
      res.json({
        message: 'That route is not publicly available.',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
