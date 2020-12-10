const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');

const middlewares = require('../../middlewares.js');

// Define validation Schema
const documentsSchema = Joi.array().items(Joi.object().keys({
  doc_id: Joi.string().required(),
  client_id: Joi.string().required(),
  doc_type: Joi.string().required(),
}).unknown(true));

// Config all process.env values
require('dotenv').config();

// Connect to MeiliSearch Client
const client = new MeiliSearch({
  host: process.env.MEILI_DOCKER_URL,
});

// Creeate Router to assign APIs
const router = Router();

// GET all documents for specified index_uid
// Defaults to return first 50 results

router.get('/documents', middlewares.checkJwt, middlewares.meiliAccess, async (req, res, next) => {
  try {
    const documents = await client.getIndex(req.body.client_id).getDocuments({
      limit: req.body.limit || 50,
    });
    res.send(documents);
  } catch (error) {
    next(error);
  }
});

// POST a document to a specific index
//

router.post('/documents', middlewares.checkJwt, middlewares.meiliAccess, async (req, res, next) => {
  try {
    const value = await documentsSchema.validateAsync(req.body.documents);
    const index = await client.getIndex(req.body.client_id);
    const response = await index.addDocuments(value);
    res.json({
      message: `${value.length} document(s) added have been created.`,
      service_message: response,
      // stack: process.env.NODE_ENV === 'production' ? '' : response,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422);
    }
    next(error);
  }
});

module.exports = router;
