const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');

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
    const searchParams = {
      offset: value.searchParams.offset || 0,
      limit: value.searchParams.limit || 50,
      filters: value.searchParams.filters || null,
      facetFilters: value.searchParams.facetFilters || null,
    };
    const searchResults = await client.getIndex(lowerClientId).search(q, searchParams);
    res.send(searchResults);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
