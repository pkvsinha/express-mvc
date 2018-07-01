function _5xxHandler(err, req, res, next) {
  console.error(err.stack);
  // error page
  res.sendStatus(500);
}

// assume 404 since no middleware responded
function _4xxHandler(req, res, next) {
  res.sendStatus(404);
}

exports.enable = function (app) {
  app.use(_5xxHandler);
  app.use(_4xxHandler);
};
