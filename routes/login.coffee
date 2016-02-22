Model = require('../models/model.js').Model

exports.post = (req, res, next) ->
  email = req.body.email
  password = req.body.password
  console.log req.session.sessionID
  Model.User.findOne(where:
    email: email
    password: password).then (user) ->
      if !user
        res.sendStatus 403
      else
        req.session.user = user.authId
        res.send user
      return
  return
