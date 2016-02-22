var elastic = require('../libs/elastic');
var Model = require('../models/model.js').Model;
var allPostsInformation = require('./rating').allPostsInformation;
var Promise = require('bluebird');

exports.get = function(req, res) {

    var tagPosts = elastic.getSuggestions("tag", req.params.input).then(function (result) {
        var afterElastic = [];
        if (result.docsuggest){
            afterElastic = result.docsuggest[0].options;
        }
        return Promise.all(afterElastic.map(function (tag) {
            return Model.Tag.findOne({ where: {name: tag.text}}).then(function(tag){
                return tag.getCreatives();
            });
        }));
    });

    var userPosts = elastic.getSuggestions("user", req.params.input).then(function (result) {
        var afterElastic = [];
        if (result.docsuggest){
            afterElastic = result.docsuggest[0].options;
        }
        return Promise.all(afterElastic.map(function (userObj) {
            return Model.User.findOne({ where: {authId: userObj.text}}).then(function(user){
                return user.getCreatives();
            });
        }));
    });

    var commentPosts = elastic.getSuggestions("comment", req.params.input).then(function (result) {
        var afterElastic = [];
        if (result.docsuggest){
            afterElastic = result.docsuggest[0].options;
        }
        return Promise.all(afterElastic.map(function (commentObj) {
            return Model.Comment.findOne({ where: {body: commentObj.text}}).then(function(comment){
                return Model.Creative.findOne({where:{id: comment.creativeId}}).then(function(post){
                    return post;
                });
            });
        }));
    });

    var creativePosts = elastic.getSuggestions("creative", req.params.input).then(function (result) {
        var afterElastic = [];
        if (result.docsuggest){
            afterElastic = result.docsuggest[0].options;
        }
        return Promise.all(afterElastic.map(function (creativeObj) {
            return Model.Creative.findOne({ where: {title: creativeObj.text}}).then(function(creative){
                return creative;
            });
        }));
    });

    Promise.all([tagPosts, userPosts, creativePosts, commentPosts]).then(function(posts){
        var temp = [].concat.apply([], posts);
        var result = [].concat.apply([], temp);
        result = result.unique();
        allPostsInformation(result).then(function (posts) {
            res.send(posts);
        }, function (err) {
            res.sendStatus(402)
        });
    })
};

Array.prototype.unique = function() {
    var o = {}, i, l = this.length, r = [];
    for(i=0; i<l;i+=1) o[this[i].id] = this[i];
    for(i in o) r.push(o[i]);
    return r;
};

//var commentPosts = elastic.getSuggestions("comment", req.params.input).then(function (result) {
//    var afterComment = result.docsuggest[0].options;
//    var arr = [];
//    afterComment.map(function (commentObj) {
//        return Model.Comment.findOne({ where: {body: commentObj.text}}).then(function(comment){
//            return arr.concat([1,2,3]);
//        });
//    });
//    return arr;
//});