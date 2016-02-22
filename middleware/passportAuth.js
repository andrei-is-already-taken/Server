var Model = require('../models/model.js').Model;
var passport = require('passport');
var StrategyFB = require('passport-facebook').Strategy;
var StrategyTW = require('passport-twitter').Strategy;
var StrategyVK = require('passport-vkontakte').Strategy;
var config = require('../config');


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new StrategyFB({
        clientID: config.get('FB:appId'),
        clientSecret: config.get('FB:appSecret'),
        callbackURL: config.get('FB:callbackUrl')
    }, function (token, tokenSecret, profile, done) {
    Model.User.findOrCreate({where: {authId: profile.id}, defaults: {authId: profile.id}})
        .spread(function (user, created) {
            return done(null, user);
        });
}));

passport.use(new StrategyTW({
        consumerKey: config.get('TW:appId'),
        consumerSecret: config.get('TW:appSecret'),
        callbackURL:  config.get('TW:callbackUrl')
    }, function (token, tokenSecret, profile, done) {
    Model.User.findOrCreate({where: {authId: profile.id.toString()}, defaults: {authId: profile.id.toString()}})
        .spread(function (user, created) {
            return done(null, user);
        });
}));

passport.use(new StrategyVK({
    clientID: config.get('VK:appId'),
    clientSecret: config.get('VK:appSecret'),
    callbackURL:  config.get('VK:callbackUrl')
},function (token, tokenSecret, profile, done) {
    Model.User.findOrCreate({where: {authId: profile.id.toString()}, defaults: {authId: profile.id.toString()}})
        .spread(function (user, created) {
            return done(null, user);
        });
}));