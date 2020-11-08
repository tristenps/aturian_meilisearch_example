const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');

// Define validation Schema
const searchSchema = Joi.object({
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
});

// Creeate Router to assign APIs
const router = Router();

// GET search request for a specific indexes documents
//
router.get('/:index_uid/search', async (req, res, next) => {
  try {
    const value = await searchSchema.validateAsync(req.body);
    const q = value.searchParams.query;
    const searchParams = {
      offset: value.searchParams.offset || 0,
      limit: value.searchParams.limit || 50,
      filters: value.searchParams.filters || null,
      facetFilters: value.searchParams.facetFilters || null,
    };
    const searchResults = await client.getIndex(req.params.index_uid).search(q, searchParams);
    res.send(searchResults);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
