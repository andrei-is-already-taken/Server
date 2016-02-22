Model = require('../models/model.js').Model
Promise = require('bluebird')
cloudinary = require('../libs/cloudinary')
fs = require('fs')

exports.post = (req, res) ->
  creative = cloudinary.uploadBase64(req.body.img, req.session.user).then((upload) ->
    map = undefined
    if req.body.map
      map = [
        req.body.map.currentX
        req.body.map.currentY
        req.body.map.pointX
        req.body.map.pointY
      ]
    Model.Creative.create
      title: req.body.title
      description: req.body.description
      category: req.body.category
      template: req.body.template
      article: req.body.article
      videoLink: req.body.videoLink
      map: map
      url: upload.url
      publicId: upload.public_id
  )
  user = Model.User.findOne(where: authId: req.session.user)
  tag_array = Promise.all(req.body.tags.map((tag) ->
    Model.Tag.findOrCreate
      where: name: tag.name
      defaults: name: tag.name
  ))
  Promise.all([
    user
    creative
    tag_array
  ]).spread((user, creative, tag_array) ->
    tags = tag_array.map((tag_entry) ->
      tag_entry[0]
    )
    [
      creative.addTags(tags)
      user.addCreative(creative)
    ]
  ).spread (creative, user) ->
    if creative and user
      res.sendStatus 200
    else
      res.sendStatus 403
    return
  return

exports.allForUser = (req, res) ->
  Model.User.findById(req.params.id).then((user) ->
    user.getCreatives()
  ).then((creatives) ->
    [
      creatives
      Promise.all(creatives.map((creative) ->
        creative.getCreativeRatings()
      ))
    ]
  ).spread(Model.AddScores).then(Model.AddTags).then ((creatives) ->
    res.send creatives
    return
  ), ->
    res.sendStatus 403
    return
  return

exports.getSpecificPost = (req, res) ->
  creativeId = req.params.id
  Model.Creative.findById(creativeId).then((post) ->
    [ post ]
  ).then(Model.AddTags).then (creatives) ->
    res.send creatives[0]
    return
  return

exports.getAllTags = (req, res) ->
  Model.Tag.findAll().then((tags) ->
    names = tags.map((tag) ->
      tag.dataValues.name
    )
    counts = Promise.all(tags.map((tag) ->
      tag.getCreatives().then (creatives) ->
        creatives.length
    ))
    [
      names
      counts
    ]
  ).spread (names, counts) ->
    result = []
    i = 0
    while i < names.length
      result.push
        text: names[i]
        weight: counts[i]
      result[i].link = 'http://localhost:8000/app/#/main/tag/' + names[i]
      i++
    res.send result
    return
  return

exports.delete = (req, res) ->
  Model.Creative.findOne(where: id: req.params.id).then((creative) ->
    creative.destroy()
  ).then (result) ->
    if result
      res.sendStatus 200
    else
      res.sendStatus 403
    return
  return