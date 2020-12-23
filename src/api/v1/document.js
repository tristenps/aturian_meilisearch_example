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
  apiKey: process.env.MEILI_MASTER_KEY,
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

// POST an array of documents to their respective indices
//

router.post('/documents', middlewares.checkJwt, middlewares.meiliAccess, async (req, res, next) => {
  try {
    // Validate post request contains required fields
    const validated = await documentsSchema.validateAsync(req.body.documents);

    // Initialize holder of responses for each document that is posted
    const results = [];

    await Promise.all(validated.map(async (doc) => {
      // TODO: Remove after OrderJson is deprecated
      // Check which field to parse
      // When removing, update in body of postData
      const parsedData = doc.OrderJson ? JSON.parse(doc.OrderJson) : JSON.parse(doc.data);

      const postData = await client.getIndex(doc.client_id).addDocuments([{
        doc_id: doc.doc_id,
        client_id: doc.client_id,
        doc_type: doc.doc_type,
        data: parsedData,
      }]);
      results.push(postData);
    }));
    res.json({
      message: `${validated.length} document(s) added have been created.`,
      service_message: results,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(422);
    } else if (error.name === 'SyntaxError') {
      res.json({
        message: 'Json within data or OrderJson keypair could not be parsed',
      });
    }
    next(error);
  }
});

// eslint-disable-next-line no-unused-vars
function parseJsonPostData(data, keyOne, keyTwo) {
  try {
    return data.keyOne ? JSON.parse(data.keyOne) : JSON.parse(data.keyTwo);
  } catch (error) {
    return { noData: null };
  }
}

module.exports = router;
