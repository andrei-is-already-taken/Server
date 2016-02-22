async = require('async')
conf = require('../config')
util = require('util')
Promise = require('bluebird')
Sequelize = require('sequelize')
cloudinary = require('../libs/cloudinary')

Array::diff = (a) ->
  @filter (i) ->
    a.indexOf(i) < 0

DestroyTags = (creative) ->
  creativeTags = creative.getTags()
  allTags = Model.Tag.findAll()
  Promise.all([
    creativeTags
    allTags
  ]).spread (creativeTags, allTags) ->
    creativeIds = creativeTags.map((tag) ->
      tag.id
    )
    allIds = allTags.map((tag) ->
      tag.id
    )
    diff = allIds.diff(creativeIds)
    toDelete = creativeIds.diff(diff)
    Model.Tag.destroy where: id: toDelete

sequelize = new Sequelize(conf.get('DB:table'), conf.get('DB:user'), conf.get('DB:password'),
  host: conf.get('DB:host')
  dialect: 'postgres'
  pool:
    max: 5
    min: 0
    idle: 10000)

Creative = sequelize.define('creative', {
  category: Sequelize.STRING
  title: Sequelize.STRING
  description: Sequelize.TEXT
  article: Sequelize.TEXT
  template: Sequelize.TEXT
  imageLink: Sequelize.STRING
  videoLink: Sequelize.STRING
  map: Sequelize.ARRAY(Sequelize.DECIMAL)
  url: Sequelize.STRING
  publicId: Sequelize.STRING
}, {
  hooks:
    beforeDestroy: (creative) ->
      cloudinary.destroy creative.url
      DestroyTags creative
      return
})
Avatar = sequelize.define('avatar',
  url: Sequelize.STRING
  publicId: Sequelize.STRING)
Category = sequelize.define('category', name: Sequelize.TEXT)
Tag = sequelize.define('tag', name: Sequelize.STRING)
User = sequelize.define('user',
  authId: Sequelize.STRING
  password: Sequelize.STRING
  theme:
    type: Sequelize.STRING
    defaultValue: 'light'
  language:
    type: Sequelize.STRING
    defaultValue: 'en'
  firstName: Sequelize.STRING
  lastName: Sequelize.STRING
  about: Sequelize.STRING
  rating:
    type: Sequelize.DECIMAL
    defaultValue: 0
  email: type: Sequelize.STRING)

Passport = sequelize.define('passport', user: Sequelize.STRING)

Rating = sequelize.define('rating', score: Sequelize.INTEGER)
CreativeRating = sequelize.define('CreativeRating', score: Sequelize.INTEGER)
UserRating = sequelize.define('user_rating', score: Sequelize.INTEGER)
Comment = sequelize.define('comment', body: Sequelize.TEXT)
CommentRating = sequelize.define('CommentRating', {})
Medal = sequelize.define('medal',
  name: Sequelize.TEXT
  level: Sequelize.INTEGER
  link: Sequelize.STRING)
User.hasMany Creative
Creative.belongsToMany Tag, through: 'CreativeTag'
Tag.belongsToMany Creative, through: 'CreativeTag'
#Creative.belongsTo(Category);
User.belongsToMany Medal, through: 'UserMedal'
Medal.belongsToMany User, through: 'UserMedal'
#CreativeRating.belongsTo(User);
User.hasMany CreativeRating
Creative.hasMany CreativeRating
Creative.hasMany Comment
Comment.belongsTo User
User.hasOne Avatar
CommentRating.belongsTo User
Comment.hasMany CommentRating
User.hasOne Avatar
Model =
  Comment: Comment
  Rating: Rating
  CommentRating: CommentRating
  Creative: Creative
  User: User
  Medal: Medal
  Category: Category
  Tag: Tag
  Avatar: Avatar
  CreativeRating: CreativeRating
  AddScores: (creatives, ratings) ->
    sums = ratings.map((ratings) ->
      sum = 0
      ratings.forEach (rating) ->
        sum += rating.score
        return
      sum
    )
    i = 0
    while i < creatives.length
      creatives[i].dataValues.score = sums[i]
      i++
    creatives
  AddRatables: (creatives, user) ->
    if !user
      return creatives
    allRatings = Promise.all(creatives.map((creative) ->
      creative.getCreativeRatings()
    ))
    allRatings.then (allRatings) ->
      i = 0
      while i < allRatings.length
# console.log("allRating", allRatings[i])
        alreadyRated = allRatings[i].some((rating) ->
          rating.dataValues.userId == user.id
        )
        creatives[i].dataValues.ratable = !alreadyRated
        #console.log(creatives[i]);
        i++
      console.log 'ADDED RATABLESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS'
      creatives
  AddUsers: (creatives) ->
    userPromises = creatives.map((creative) ->
      Model.User.findById creative.userId
    )
    new Promise((resolve, reject) ->
      Promise.all(userPromises).then((users) ->
        i = 0
        while i < creatives.length
          creatives[i].dataValues.user = users[i].dataValues
          i++
        return
      ).then ->
        resolve creatives
        return
    )
  AddTags: (creatives) ->
    tagsPromises = creatives.map((creative) ->
      creative.getTags()
    )
    new Promise((resolve, reject) ->
      Promise.all(tagsPromises).then((tags) ->
        i = 0
        while i < creatives.length
          tagValues = tags[i].map((tag) ->
            tag.dataValues
          )
          creatives[i].dataValues.tags = tagValues
          i++
        return
      ).then ->
        resolve creatives
        return
    )
  DestroyTags: DestroyTags
  Passport: Passport


sequelize.sync(force: true).then ->
  Promise.all [
    Model.Medal.create(
      name: 'bestPost'
      level: 1
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/bronze_best_post_xcxbwo.png')
    Model.Medal.create(
      name: 'bestPost'
      level: 2
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990169/silver_best_post_cnflug.png')
    Model.Medal.create(
      name: 'bestPost'
      level: 3
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/gold_best_post_qa8uax.png')
    Model.Medal.create(
      name: 'badPost'
      level: 1
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/bronze_worst_post_ylbodc.png')
    Model.Medal.create(
      name: 'badPost'
      level: 2
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990169/silver_worst_post_p2f8tb.png')
    Model.Medal.create(
      name: 'badPost'
      level: 3
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990169/gold_worst_post_tqi1kw.png')
    Model.Medal.create(
      name: '100posts'
      level: 3
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/100_posts_gold_ecq3bg.png')
    Model.Medal.create(
      name: 'firstPost'
      level: 3
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/first_post_gold_gu5mpt.png')
    Model.Medal.create(
      name: 'topRating'
      level: 1
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/best_user_bronze_ddumqi.png')
    Model.Medal.create(
      name: 'topRating'
      level: 2
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/best_user_silver_gg6lr3.png')
    Model.Medal.create(
      name: 'topRating'
      level: 3
      link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/best_user_gold_rabmmk.png')
  ]

exports.Model = Model;