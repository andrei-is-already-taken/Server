var Model = require('../models/model.js').Model;

module.exports = function(req, res, next) {
  req.user = res.locals.user = null;
  if (!req.session.user) return next();
  next();
};