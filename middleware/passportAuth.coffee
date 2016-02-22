Model = require('../models/model.js').Model
passport = require('passport')
StrategyFB = require('passport-facebook').Strategy
StrategyTW = require('passport-twitter').Strategy
StrategyVK = require('passport-vkontakte').Strategy
config = require('../config')
passport.serializeUser (user, done) ->
  done null, user
  return
passport.deserializeUser (user, done) ->
  done null, user
  return
passport.use new StrategyFB({
  clientID: config.get('FB:appId')
  clientSecret: config.get('FB:appSecret')
  callbackURL: config.get('FB:callbackUrl')
}, (token, tokenSecret, profile, done) ->
  Model.User.findOrCreate(
    where: authId: profile.id
    defaults:
      authId: profile.id
      firstName: profile.displayName).spread (user, created) ->
  done null, user
  return
)
passport.use new StrategyTW({
  consumerKey: config.get('TW:appId')
  consumerSecret: config.get('TW:appSecret')
  callbackURL: config.get('TW:callbackUrl')
}, (token, tokenSecret, profile, done) ->
  Model.User.findOrCreate(
    where: authId: profile.id.toString()
    defaults:
      authId: profile.id.toString()
      firstName: profile.displayName).spread (user, created) ->
  if created
    return Model.Avatar.findOrCreate(where: url: profile._json.profile_image_url).spread((avatar, created) ->
      if created
        return user.setAvatar(avatar)
      null
    ).then(->
      done null, user
    )
  done null, user
  return
)
passport.use new StrategyVK({
  clientID: config.get('VK:appId')
  clientSecret: config.get('VK:appSecret')
  callbackURL: config.get('VK:callbackUrl')
}, (token, tokenSecret, profile, done) ->
  Model.User.findOrCreate(
    where: authId: profile.id.toString()
    defaults:
      authId: profile.id.toString()
      firstName: profile._json.first_name
      lastName: profile._json.last_name).spread (user, created) ->
        if created
          return Model.Avatar.findOrCreate(where: url: profile._json.photo).spread((avatar, created) ->
            if created
              return user.setAvatar(avatar)
            null
          ).then(->
            done null, user
          )
        done null, user
  return
)