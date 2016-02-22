var CronJob = require('cron').CronJob;
var Model = require('../models/model.js').Model;
var elastic = require('./elastic');
var Promise = require('bluebird');

var job = new CronJob('0 */1 * * * *', function() {
    var tag = elastic.initialize("tag");
    var user = elastic.initialize("user");
    var creative = elastic.initialize("creative");
    var comment = elastic.initialize("comment");
    var tags = Model.Tag.findAll();
    var users = Model.User.findAll();
    var comments = Model.Comment.findAll();
    var creatives = Model.Creative.findAll();

    Promise.all([tag,user,creative,comment, tags, users, comments, creatives]).spread(function(_,_,_,_, tags, users, comments, creatives) {
        var tagsPromises = tags.map(function (tag) {
            return elastic.add("tag",tag.name, tag.name);
        });

        var usersPromises = users.map(function (user) {
            return elastic.add("user",user.firstName+" "+user.lastName+" "+user.about, user.authId);
        });

        var commentsPromises = comments.map(function (comment) {
            return elastic.add("comment",comment.body, comment.body);
        });
        var creativesPromises = creatives.map(function (creative) {
            return elastic.add("creative",creative.title +" "+ creative.article, creative.title);
        });

        return Promise.all([tagsPromises, usersPromises, commentsPromises, creativesPromises]).then(function() {
        })
    })}, function () {
    }, true
);
