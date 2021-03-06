const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://aturian.us.auth0.com/.well-known/jwks.json',
  }),

  // Validate the audience and the issuer.
  audience: 'https://aturian-services.aturian.com',
  issuer: 'https://aturian.us.auth0.com/',
  algorithms: ['RS256'],
});

const meiliAccess = jwtAuthz(['service:meili']);

module.exports = {
  checkJwt,
  meiliAccess,
};
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  // Error handling for Node, meili and Auth errors
  // const statusCode = error.status ? error.status : (error.httpStatus ? error.httpStatus : 500) ;
  let statusCode;
  if (error.status) {
    statusCode = error.status;
  } else if (error.httpStatus) {
    statusCode = error.httpStatus;
  } else {
    statusCode = 500;
  }
  res.status(statusCode);
  // console.log(error);
  res.json({
    message: error.message,
    // stack: process.env.NODE_ENV === 'production' ? '' : error.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
  checkJwt,
  meiliAccess,
};
