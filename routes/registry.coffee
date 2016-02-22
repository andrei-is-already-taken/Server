Model = require('../models/model.js').Model
uuid = require('uuid')

exports.post = (req, res, next) ->
  username = req.body.username
  password = req.body.password
  email = req.body.email
  surname = req.body.surname
  about = req.body.about
  theme = req.body.theme
  language = req.body.language
  Model.User.findOne(where: email: email).then((user) ->
    if user
      return null
    Model.User.create
      authId: uuid.v1()
      theme: theme
      language: language
      firstName: username
      lastName: surname
      email: email
      about: about
      password: password
  ).then (user) ->
    if user
      req.session.user = user.authId
      res.send user
    else
      req.session.user = null
      res.sendStatus 403
    return
  return