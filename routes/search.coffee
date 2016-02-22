elastic = require('../libs/elastic')
Model = require('../models/model.js').Model
allPostsInformation = require('./rating').allPostsInformation
Promise = require('bluebird')

exports.get = (req, res) ->
  tagPosts = elastic.getSuggestions('tag', req.params.input).then((result) ->
    afterElastic = []
    if result.docsuggest
      afterElastic = result.docsuggest[0].options
    Promise.all afterElastic.map((tag) ->
      Model.Tag.findOne(where: name: tag.text).then (tag) ->
        tag.getCreatives()
    )
  )
  userPosts = elastic.getSuggestions('user', req.params.input).then((result) ->
    afterElastic = []
    if result.docsuggest
      afterElastic = result.docsuggest[0].options
    Promise.all afterElastic.map((userObj) ->
      Model.User.findOne(where: authId: userObj.text).then (user) ->
        user.getCreatives()
    )
  )
  commentPosts = elastic.getSuggestions('comment', req.params.input).then((result) ->
    afterElastic = []
    if result.docsuggest
      afterElastic = result.docsuggest[0].options
    Promise.all afterElastic.map((commentObj) ->
      Model.Comment.findOne(where: body: commentObj.text).then (comment) ->
        Model.Creative.findOne(where: id: comment.creativeId).then (post) ->
          post
    )
  )
  creativePosts = elastic.getSuggestions('creative', req.params.input).then((result) ->
    afterElastic = []
    if result.docsuggest
      afterElastic = result.docsuggest[0].options
    Promise.all afterElastic.map((creativeObj) ->
      Model.Creative.findOne(where: title: creativeObj.text).then (creative) ->
        creative
    )
  )
  Promise.all([
    tagPosts
    userPosts
    creativePosts
    commentPosts
  ]).then (posts) ->
    temp = [].concat.apply([], posts)
    result = [].concat.apply([], temp)
    result = result.unique()
    allPostsInformation(result).then ((posts) ->
      res.send posts
      return
    ), (err) ->
      res.sendStatus 402
      return
    return
  return

Array::unique = ->
  o = {}
  i = undefined
  l = @length
  r = []
  i = 0
  while i < l
    o[@[i].id] = @[i]
    i += 1
  for i of o
    r.push o[i]
  r
