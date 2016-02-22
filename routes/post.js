var Model = require('../models/model.js').Model;
var Promise = require('bluebird');
var cloudinary = require('../libs/cloudinary');
var fs = require('fs');

exports.post = function (req, res) {
    var creative = cloudinary.uploadBase64(req.body.img, req.session.user).then(function (upload) {
        var map;
        if (req.body.map)
            map = [req.body.map.currentX, req.body.map.currentY, req.body.map.pointX, req.body.map.pointY];
        return Model.Creative.create({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            template: req.body.template,
            article: req.body.article,
            videoLink: req.body.videoLink,
            map: map,
            url: upload.url,
            publicId: upload.public_id
        });
    });

    var user = Model.User.findOne({
        where: {authId: req.session.user}
    });

    var tag_array = Promise.all(req.body.tags.map(function (tag) {
        return Model.Tag.findOrCreate({
            where: {name: tag.name},
            defaults: {name: tag.name}
        })
    }));

    Promise.all([user, creative, tag_array])
        .spread(function (user, creative, tag_array) {
            var tags = tag_array.map(function (tag_entry) {
                return tag_entry[0]
            });
            return [
                creative.addTags(tags),
                user.addCreative(creative)]
        })
        .spread(function (creative, user) {
            if (creative && user) {
                res.sendStatus(200);
            } else {
                res.sendStatus(403);
            }
        });
};


exports.allForUser = function (req, res) {
    Model.User.findById(req.params.id)
        .then(function (user) {
            return user.getCreatives()
        }).then(function (creatives) {
        return [creatives, Promise.all(creatives.map(function (creative) {
            return creative.getCreativeRatings();
        }))];
    }).spread(
        Model.AddScores
    ).then(
        Model.AddTags
    ).then(function (creatives) {
        res.send(creatives);
    }, function () {
        res.sendStatus(403);
    });
};

exports.getSpecificPost = function (req, res) {
    var creativeId = req.params.id;
    Model.Creative.findById(creativeId)
        .then(function (post) {
            return [post];
        })
        .then(
            Model.AddTags
        )
        .then(function(creatives){
            res.send(creatives[0]);
        });
};

exports.getTags = function (req, res) {
    Model.Tag.findAll()
        .then(function (tags) {
            var names = tags.map(function(tag){
                return tag.dataValues.name;});
            var counts = Promise.all(tags.map(function (tag) {
                return tag.getCreatives().then(function (creatives) {
                    return creatives.length})}));
            return [names, counts];
        })
        .spread(function (names, counts) {
            var result = [];
            for(var i = 0; i < names.length; i++) {
                result.push({text: names[i], weight: counts[i]});
                result[i].link = 'http://localhost:8000/app/#/main/tag/' + names[i];
            }
            res.send(result);
        });
};

exports.delete = function (req,res) {
    Model.Creative.findOne({where: {id: req.params.id}})
        .then(function (creative) {
            return creative.destroy();
        }).then(function(result){
            if (result)
                res.sendStatus(200);
            else
                res.sendStatus(403)
        });
};