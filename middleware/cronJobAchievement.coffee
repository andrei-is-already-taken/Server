CronJob = require('cron').CronJob
Model = require('../models/model.js').Model
Promise = require('bluebird')
jobWeek = new CronJob('*/10 * * * * *', (->
#'* * * * * 1'
  users = Model.User.findAll()
  creativesWitnRating = users.map((user) ->
    getCreativesWitnRatingForUser user
  )
  Promise.all([
    creativesWitnRating
    users
  ]).spread((creatives, users) ->
    temp = [].concat.apply([], creatives)
    result = [].concat.apply([], temp)
    userArray = [].concat.apply([], users)
    [
      result.sort(compareCreatives)
      userArray.sort(compareUsers)
    ]
  ).spread (result, users) ->
    firstSet = setMedalsForCreatives('badPost', arrayFrom(result))
    secondSet = setMedalsForCreatives('bestPost', arrayFrom(result.reverse()))
    topUsersArr = topUsers(users)
    userSet = topUsersArr.map((user) ->
      setMedalForUser 'topRating', user
    )
    Promise.all([
      firstSet
      secondSet
      userSet
    ]).then ->
      null
), (->
), true)
jobDay = new CronJob('*/10 * * * * *', (->
#'0 0 */23 * * *'
  users = Model.User.findAll()
  hundredPosts = users.map((user) ->
    user.getCreatives().then (creatives) ->
      if creatives.length
        setfirst = setMedalForUser('firstPost', user)
      if creatives.length >= 100
        setHundred = setMedalForUser('100posts', user)
      Promise.all [
        setfirst
        setHundred
      ]
  )
  Promise.all([ hundredPosts ]).spread ->
    null
), (->
), true)
jobHour = new CronJob('*/5 * * * * *', (->
#'0 */59 * * * *'
  users = Model.User.findAll()
  rating = users.map((user) ->
    getCreativesWitnRatingForUser(user).then (creatives) ->
      `var rating`
      rating = 0
      Promise.all(creatives.map((creative) ->
        rating += creative.dataValues.score
      )).then ->
        if creatives.length
          rating /= creatives.length
        user.update rating: rating
        return
  )
  Promise.all([ rating ]).spread ->
    null
), (->
), true)

getCreativesWitnRatingForUser = (user) ->
  user.getCreatives().then((creatives) ->
    ratings = Promise.all(creatives.map((creative) ->
      creative.getCreativeRatings()
    ))
    [
      creatives
      ratings
    ]
  ).spread Model.AddScores

compareCreatives = (a, b) ->
  if a.dataValues.score < b.dataValues.score
    -1
  else if a.dataValues.score > b.dataValues.score
    1
  else
    0

compareUsers = (a, b) ->
  if a.dataValues.rating < b.dataValues.rating
    -1
  else if a.dataValues.rating > b.dataValues.rating
    1
  else
    0

topUsers = (arr) ->
  if arr.length
    arr.reverse()
    value = arr[0].dataValues.rating
  resultArray = []
  i = 0
  while i < arr.length
    if arr[i].dataValues.rating == value
      resultArray.push arr[i]
    else
      break
    i++
  resultArray

arrayFrom = (arr) ->
  if arr.length
    value = arr[0].dataValues.score
  resultArray = []
  i = 0
  while i < arr.length
    if arr[i].dataValues.score == value
      resultArray.push arr[i]
    else
      break
    i++
  resultArray

getNextLevel = (medals) ->
  level = 1
  i = 0
  while i < medals.length
    if medals[i].dataValues.level == 3
      return null
    else
      level = medals[i].dataValues.level + 1
    i++
  level

setMedalsForCreatives = (medalName, creatives) ->
  Promise.all creatives.map((creative) ->
    Model.User.findById(creative.dataValues.userId).then (user) ->
      setMedalForUser medalName, user
  )

setMedalForUser = (medalName, user) ->
  user.getMedals(where: name: medalName).then (medals) ->
    level = getNextLevel(medals, medalName)
    if level and level <= 3
      if medalName == 'firstPost' or medalName == '100Posts'
        level = 3
      console.log 'USER ', user.dataValues.firstName, ' GET MEDAL ', medalName, ' OF LEVEL ', level
      return Model.Medal.findOne(where:
        name: medalName
        level: level).then((medal) ->
        user.addMedal medal
      )
    null

# ---
# generated by js2coffee 2.1.0