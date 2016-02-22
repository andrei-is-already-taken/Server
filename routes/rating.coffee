Model = require('../models/model.js').Model
Promise = require('bluebird')

allPostsInformation = (creatives, user) ->
  ratings = Promise.all(creatives.map((creative) ->
    creative.getCreativeRatings()
  ))
  currentUser = Model.User.find(where: authId: user)
  Promise.all([
    creatives
    ratings
  ]).spread(Model.AddScores).then(Model.AddUsers).then((creatives) ->
    creatives.sort().reverse().slice 0, 50
  ).then(Model.AddTags).then((creatives) ->
    [
      creatives
      currentUser
    ]
  ).spread (creatives, currentUser) ->
    Model.AddRatables creatives, currentUser

exports.getRatedCreatives = (req, res) ->
  ratedPosts = Model.Creative.findAll({}).then((creatives) ->
    allPostsInformation creatives, req.session.user
  )
  ratedPosts.then ((posts) ->
    console.log posts
    res.send posts
    return
  ), (err) ->
    res.sendStatus 402
    return
  return

exports.allPostsInformation = allPostsInformation

exports.rateCreative = (req, res) ->
  score = req.body.score
  id = req.body.id
  sum = 0
  currentUser = Model.User.findOne(where: authId: req.session.user)
  currentCreative = Model.Creative.findById(id)
  creativeRatings = currentCreative.then((creative) ->
    creative.getCreativeRatings()
  )
  userRatings = currentUser.then((user) ->
    user.getCreativeRatings()
  )
  Promise.all([
    creativeRatings
    userRatings
    currentUser
  ]).spread((creativeRatings, userRatings, user) ->
    creativeRatings.forEach (rating) ->
      sum += rating.score
      return
    alreadyRated = creativeRatings.some((creativeRating) ->
      creativeRating.userId == user.id
    )
    if alreadyRated
      res.sendStatus 403
    else
      return [
        Model.CreativeRating.create(score: score)
        currentUser
        currentCreative
      ]
    return
  ).spread((creativeRating, user, creative) ->
    [
      user.addCreativeRating(creativeRating)
      creative.addCreativeRating(creativeRating)
    ]
  ).then ->
    res.send score: sum + score
    return
  return