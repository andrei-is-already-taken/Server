var Model = require('../models/model.js').Model;
var Promise = require('bluebird');

exports.getRatedCreatives = function (req, res) {
    var ratedPosts = Model.Creative.findAll({
        // include: [Model.Category]
    }).then(function (creatives) {
        return allPostsInformation(creatives, req.session.user);
    });
    ratedPosts.then(function (posts) {
        console.log(posts);
        res.send(posts);
    }, function (err) {
        res.sendStatus(402)
    });
};

function allPostsInformation(creatives, user) {
    var ratings = Promise.all(creatives.map(function (creative) {
        return creative.getCreativeRatings();
    }));
    var currentUser = Model.User.find({where: {authId:user}});
    return Promise.all([creatives, ratings])
        .spread(
            Model.AddScores
        ).then(
            Model.AddUsers
        ).then(function (creatives) {
            return creatives.sort().reverse().slice(0, 50);
        }).then(
            Model.AddTags
        ).then(function (creatives) {
            return [creatives, currentUser]})
        .spread(function(creatives, currentUser){
            return Model.AddRatables(creatives, currentUser);
        });
}
exports.allPostsInformation = allPostsInformation;

exports.rateCreative = function (req, res) {
    var score = req.body.score;
    var id = req.body.id;
    var sum = 0;
    var currentUser =
        Model.User.findOne({where: {authId: req.session.user}});
    var currentCreative =
        Model.Creative.findById(id);
    var creativeRatings =
        currentCreative.then(function (creative) {
            return creative.getCreativeRatings();
        });
    var userRatings =
        currentUser.then(function (user) {
            return user.getCreativeRatings();
        });

    Promise.all([creativeRatings, userRatings, currentUser])
        .spread(function (creativeRatings, userRatings, user) {
            creativeRatings.forEach(function (rating) {
                sum += rating.score;
            });
            var alreadyRated = creativeRatings.some(function (creativeRating) {
                return creativeRating.userId == user.id;
            });
            if (alreadyRated) {
                res.sendStatus(403);
            } else {
                return [Model.CreativeRating.create({score: score}), currentUser, currentCreative];
            }
        })
        .spread(function (creativeRating, user, creative) {
            return [user.addCreativeRating(creativeRating), creative.addCreativeRating(creativeRating)];
        })
        .then(function () {
            res.send({score: sum + score});
        });
};