// Require in all NPM packages
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const middlewares = require('./middlewares');
const docs = require('./api/v1/document');
const indx = require('./api/v1/indx');
const search = require('./api/v1/search');
const auth = require('./api/v1/auth');

require('dotenv').config();

// connect to mongodb

const app = express();
app.use(morgan('common'));
app.use(helmet());
app.use(cors({
  orign: process.env.CORS_ORIGIN,
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
  });
});

// APIs
app.use('/api/v1/auth', auth);
app.use('/api/v1/client', indx);
app.use('/api/v1/', docs);
app.use('/api/v1/', search);

// Middleware Error Handlers
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const port = process.env.PORT || 1337;
app.listen(port, () => {});
