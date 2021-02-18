const { Router } = require('express');
const MeiliSearch = require('meilisearch');
const Joi = require('joi');
const crypto = require('crypto');

const middlewares = require('../../middlewares.js');

// Define validation Schema
const documentsSchema = Joi.array().items(Joi.object().keys({
  doc_id: Joi.string().required(),
  client_id: Joi.string().required(),
  doc_type: Joi.string().required(),
}).unknown(true));

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

// GET all documents for specified index_uid
// Defaults to return first 50 results

router.get('/documents', middlewares.checkJwt, middlewares.meiliAccess, async (req, res, next) => {
  try {
    const hashClientId = crypto.createHash('sha1').update(req.body.client_id.toLowerCase() + salt).digest('hex');
    const documents = await client.getIndex(hashClientId).getDocuments({
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
      // Check which field to parse
      // When removing, update in body of postData
      const parsedData = doc.OrderJson ? JSON.parse(doc.OrderJson) : JSON.parse(doc.Data);

      // TODO: Create specific parsing rules for information pulled from data by doc_type
      const { jobID, userEmail, salesmanName } = parsedData;

      const itemSummary = [];
      const suppSummary = [];
      const shipSummary = [];

      if (doc.doc_type === 'order') {
        try {
          parsedData.orderItem.forEach((item) => {
            itemSummary.push(item.itemTitle);
            suppSummary.push(item.orderItemVendor.name);
            // eslint-disable-next-line prefer-template
            shipSummary.push([item.orderItemAddress.shippingAttention,
              item.orderItemAddress.shippingCompany,
              item.orderItemAddress.shippingStreet1,
              item.orderItemAddress.shippingStreet2,
              item.orderItemAddress.shippingCity,
              item.orderItemAddress.shippingState,
              item.orderItemAddress.shippingPostal].filter((a) => a).join(' '));
          });
        } catch (error) {
          // No items found
        }
      }

      const lowerClientId = doc.client_id.toLowerCase();
      const hashClientId = crypto.createHash('sha1').update(lowerClientId + salt).digest('hex');

      // TODO: Create definitive list of faceted attributes by doc_type?
      const facets = ['client_id', 'doc_type', 'doc_id', 'salesmanName'];

      // Check whether the index already exists, if not define appropriately
      try {
        await client.createIndex(hashClientId, {
          primaryKey: 'uid',
        });
        await client.getIndex(hashClientId).updateAttributesForFaceting(facets);
      } catch (error) {
        if (error.name !== 'MeiliSearchApiError') {
          next(error);
        }
      }

      // TODO: Implement versioning?
      // Would need to mark existing order document inactive
      const version = '1';
      const docUid = crypto.createHash('sha1').update(doc.doc_id.toLowerCase() + doc.client_id.toLowerCase() + doc.doc_type.toLowerCase() + version).digest('hex');
      const document = {
        uid: docUid,
        doc_id: doc.doc_id, // This would go away with the ... expansion
        client_id: lowerClientId, // This as well
        doc_type: doc.doc_type, // This as well
        jobID: jobID || null, // this as well
        userEmail: userEmail || null, // this as well
        salesmanName: salesmanName || null, // this as well
        itemSummary: [...new Set(itemSummary)].join(', '),
        suppSummary: [...new Set(suppSummary)].join(', '),
        shipSummary: [...new Set(shipSummary)].join(', '),
        ...parsedData,
      };

      const postData = await client.getIndex(hashClientId).addDocuments([document]);
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
