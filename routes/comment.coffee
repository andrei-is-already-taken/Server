Model = require('../models/model.js').Model
Promise = require('bluebird')

AddUsers = (comments) ->
  Promise.all([
    comments
    Promise.all(comments.map((comment) ->
      comment.getUser()
    ))
  ]).spread (comments, users) ->
    result = []
    i = 0
    while i < comments.length
      comments[i].dataValues.user = users[i].dataValues
      result.push comments[i].dataValues
      i++
    result

AddLikes = (comments, user) ->
  Promise.all(comments.map((comment) ->
    comment.getCommentRatings()
  )).then (likes) ->
    i = 0
    while i < comments.length
      comments[i].dataValues.likes = likes[i].length
      alreadyLiked = likes[i].some((like) ->
        like.dataValues.userId == user.id
      )
      comments[i].dataValues.likable = !alreadyLiked
      i++
    comments

exports.post = (req, res) ->
  comment = Model.Comment.create(body: req.body.body)
  user = Model.User.findOne(where: authId: req.session.user)
  creative = Model.Creative.findById(req.body.id)
  Promise.all([
    user
    creative
    comment
  ]).spread((user, creative, comment) ->
    [
      comment
      user
      comment.setUser(user)
      creative.addComment(comment)
    ]
  ).spread (comment, user) ->
    if comment
      comment.dataValues.user = user.dataValues
      res.send comment.dataValues
    else
      res.sendStatus 403
    return
  return

exports.all = (req, res) ->
  id = req.body.id
  currentUser = Model.User.find(where: authId: req.session.user)
  creative = Model.Creative.findById(id)
  comments = creative.then((creative) ->
    creative.getComments()
  )
  Promise.all([
    comments
    currentUser
  ]).spread(AddLikes).then((comments) ->
    [
      comments
      Promise.all(comments.map((comment) ->
        comment.getUser()
      ))
    ]
  ).spread (comments, users) ->
    result = []
    i = 0
    while i < comments.length
      comments[i].dataValues.user = users[i].dataValues
      result.push comments[i].dataValues
      i++
    res.send result
    return
  return

exports.like = (req, res) ->
  id = req.body.id
  currentUser = Model.User.findOne(where: authId: req.session.user)
  currentComment = Model.Comment.findById(id)
  likes = currentComment.then((comment) ->
    comment.getCommentRatings()
  )
  users = likes.then((likes) ->
    Promise.all likes.map((like) ->
      like.getUser()
    )
  )
  Promise.all([
    likes
    users
    currentUser
  ]).spread((likes, users, user) ->
    alreadyRated = users.some((item) ->
      item.id == user.id
    )
    if alreadyRated
      res.sendStatus 403
    else
      return [
        Model.CommentRating.create({})
        user
        currentComment
      ]
    return
  ).spread (like, user, comment) ->
    [
      like.setUser(user)
      comment.addCommentRating(like)
    ]
  return