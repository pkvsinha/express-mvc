require('dotenv').config({
  path: process.env.ENV_PATH
});
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');

const Security = require('./lib/auth/auth');
const Session = require('./lib/session');
const Correlation = require('./lib/correlation');
const ErrorHandler = require('./lib/errors');
const winston = require('winston');

const PORT = process.env.PORT || 3000;
const CONTEXT_PATH = process.env.CONTEXT_PATH || '';
const app = express();
const HTTP_LOG_FORMAT =
  ':date[iso] - INFO - :method :url :status - Correlation-Id - :correlation - :res[content-length] - :response-time ms';
/**
 * Corrrelation and HTTP logging
 */

Correlation.enable(app);
morgan.token('correlation', req => req.headers['X-Correlation-Id']);
app.use(morgan(HTTP_LOG_FORMAT, {
  skip(req, res) {
    return res.statusCode < 400;
  },
  stream: process.err
}));

app.use(compression());
app.use(helmet());
app.use(morgan(HTTP_LOG_FORMAT, {
  skip(req, res) {
    return res.statusCode >= 400;
  },
  stream: process.stdout
}));

/**
 * Public Content Settings
 */
const _absoluteStaticPath = path.join(__dirname, process.env.STATIC_PATH);
winston.info(`Serving static files from ${_absoluteStaticPath}`);
winston.info(`Mounting ${CONTEXT_PATH} for static serve`);
app.use(CONTEXT_PATH, express.static(_absoluteStaticPath));
winston.info(`Serving index.html content for all non-api '${CONTEXT_PATH}/api/*' requests.`);
app.get(new RegExp(`${!CONTEXT_PATH ? '^' : CONTEXT_PATH}/(?!api)`), (req, res) => {
  winston.info(`Serving ${_absoluteStaticPath}/index.html in response to ${req.originalUrl} `);
  res.sendFile(path.join(`${_absoluteStaticPath}/index.html`));
});
/**
 * Session
 */
Session.enable(app);

/**
 * Json parsing
 */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

/**
 *  Authentication and Authorization
 */
Security.enable(app, CONTEXT_PATH);

/**
 * Dynamically Load Controllers
 */
require('./lib/loader')(app, {
  verbose: true,
  contextPath: CONTEXT_PATH
});

/**
 * Error Handler
 */
ErrorHandler.enable(app);

/**
 * Start the App
 */
const server = app.listen(PORT, () => {
  winston.info(`Server listening on port ${PORT}`);
});
module.exports = server;
