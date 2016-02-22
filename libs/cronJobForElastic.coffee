CronJob = require('cron').CronJob
Model = require('../models/model.js').Model
elastic = require('./elastic')
Promise = require('bluebird')
job = new CronJob('0 */1 * * * *', (->
  tag = elastic.initialize('tag')
  user = elastic.initialize('user')
  creative = elastic.initialize('creative')
  comment = elastic.initialize('comment')
  tags = Model.Tag.findAll()
  users = Model.User.findAll()
  comments = Model.Comment.findAll()
  creatives = Model.Creative.findAll()
  Promise.all([
    tags
    users
    comments
    creatives
    tag
    user
    creative
    comment
  ]).spread (tags, users, comments, creatives) ->
    tagsPromises = tags.map((tag) ->
      elastic.add 'tag', tag.name, tag.name
    )
    usersPromises = users.map((user) ->
      elastic.add 'user', user.firstName + ' ' + user.lastName + ' ' + user.about, user.authId
    )
    commentsPromises = comments.map((comment) ->
      elastic.add 'comment', comment.body, comment.body
    )
    creativesPromises = creatives.map((creative) ->
      elastic.add 'creative', creative.title + ' ' + creative.article, creative.title
    )
    Promise.all([
      tagsPromises
      usersPromises
      commentsPromises
      creativesPromises
    ]).then ->
  return
), (->), true)

