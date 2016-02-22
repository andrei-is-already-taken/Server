Model = require('../models/model.js').Model
Promise = require('bluebird')
cloudinary = require('../libs/cloudinary')

exports.get = (req, res) ->
  user = req.session.user
  Model.User.findOne(
    where: authId: user
    include: [
      Model.Avatar
      Model.Medal
    ]).then (user) ->
      if user
        req.session.user = user.authId
        res.send user
      else
        res.sendStatus 403
      return
  return

exports.setThemeAndLang = (req, res) ->
  Model.User.findOne(where: authId: req.session.user).then((user) ->
    if user
      user.theme = req.body.theme
      user.language = req.body.language
      return user.save()
    else
      res.sendStatus 403
    return
  ).then (user) ->
    if user
      res.sendStatus 200
    return
  return

exports.updateUser = (req, res) ->
  Model.User.findOne(where: authId: req.session.user).then((user) ->
    user.update
      firstName: req.body.firstName or user.firstName
      lastName: req.body.lastName or user.lastName
      about: req.body.about or user.about
  ).then (result) ->
    if result
      res.sendStatus 200
    else
      res.sendStatus 403
    return
  return

exports.setUserAvatar = (req, res) ->
  user = Model.User.findOne(where: authId: req.session.user)
  icon = cloudinary.uploadBase64(req.body.img, req.session.user).then((upload) ->
    Model.Avatar.create
      url: upload.url
      publicId: upload.public_id
  )
  Promise.all([
    user
    icon
  ]).spread((user, icon) ->
    user.setAvatar icon
  ).then (result) ->
    if result
      res.sendStatus 200
    else
      res.sendStatus 403
    return
  return

exports.getSpecificUser = (req, res) ->
  Model.User.findOne(
    where: id: req.params.id
    include: [ Model.Medal ]).then (user) ->
      if user
        res.send user
      else
        res.sendStatus 403
      return
  return