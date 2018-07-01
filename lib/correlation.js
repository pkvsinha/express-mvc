const uuid = require('uuid');

function createCorrelationID() {
  return uuid.v1();
}

function readCorrelationHeader(request) {

}

function getCorrelationId() {

}

function interceptor(req, res, next) {
  req.headers['X-Correlation-Id'] = createCorrelationID();
  res.set('X-Correlation-Id', createCorrelationID());
  next();
}

exports.enable = function (app) {
  app.use(interceptor);
};
