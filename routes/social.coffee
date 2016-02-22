registrationRedirectPath = 'http://localhost:8000/app/#/'
Model = require('../models/model.js').Model

exports.log = (req, res) ->
  console.log req.sessionID
  Model.Passport.create(user: req.user.dataValues.authId).then ->
    res.redirect registrationRedirectPath