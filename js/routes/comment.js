// Generated by CoffeeScript 1.10.0
(function() {
  var AddLikes, AddUsers, Model, Promise;

  Model = require('../models/model.js').Model;

  Promise = require('bluebird');

  AddUsers = function(comments) {
    return Promise.all([
      comments, Promise.all(comments.map(function(comment) {
        return comment.getUser();
      }))
    ]).spread(function(comments, users) {
      var i, result;
      result = [];
      i = 0;
      while (i < comments.length) {
        comments[i].dataValues.user = users[i].dataValues;
        result.push(comments[i].dataValues);
        i++;
      }
      return result;
    });
  };

  AddLikes = function(comments, user) {
    return Promise.all(comments.map(function(comment) {
      return comment.getCommentRatings();
    })).then(function(likes) {
      var alreadyLiked, i;
      i = 0;
      while (i < comments.length) {
        comments[i].dataValues.likes = likes[i].length;
        alreadyLiked = likes[i].some(function(like) {
          return like.dataValues.userId === user.id;
        });
        comments[i].dataValues.likable = !alreadyLiked;
        i++;
      }
      return comments;
    });
  };

  exports.post = function(req, res) {
    var comment, creative, user;
    comment = Model.Comment.create({
      body: req.body.body
    });
    user = Model.User.findOne({
      where: {
        authId: req.session.user
      }
    });
    creative = Model.Creative.findById(req.body.id);
    Promise.all([user, creative, comment]).spread(function(user, creative, comment) {
      return [comment, user, comment.setUser(user), creative.addComment(comment)];
    }).spread(function(comment, user) {
      if (comment) {
        comment.dataValues.user = user.dataValues;
        res.send(comment.dataValues);
      } else {
        res.sendStatus(403);
      }
    });
  };

  exports.all = function(req, res) {
    var comments, creative, currentUser, id;
    id = req.body.id;
    currentUser = Model.User.find({
      where: {
        authId: req.session.user
      }
    });
    creative = Model.Creative.findById(id);
    comments = creative.then(function(creative) {
      return creative.getComments();
    });
    Promise.all([comments, currentUser]).spread(AddLikes).then(function(comments) {
      return [
        comments, Promise.all(comments.map(function(comment) {
          return comment.getUser();
        }))
      ];
    }).spread(function(comments, users) {
      var i, result;
      result = [];
      i = 0;
      while (i < comments.length) {
        comments[i].dataValues.user = users[i].dataValues;
        result.push(comments[i].dataValues);
        i++;
      }
      res.send(result);
    });
  };

  exports.like = function(req, res) {
    var currentComment, currentUser, id, likes, users;
    id = req.body.id;
    currentUser = Model.User.findOne({
      where: {
        authId: req.session.user
      }
    });
    currentComment = Model.Comment.findById(id);
    likes = currentComment.then(function(comment) {
      return comment.getCommentRatings();
    });
    users = likes.then(function(likes) {
      return Promise.all(likes.map(function(like) {
        return like.getUser();
      }));
    });
    Promise.all([likes, users, currentUser]).spread(function(likes, users, user) {
      var alreadyRated;
      alreadyRated = users.some(function(item) {
        return item.id === user.id;
      });
      if (alreadyRated) {
        res.sendStatus(403);
      } else {
        return [Model.CommentRating.create({}), user, currentComment];
      }
    }).spread(function(like, user, comment) {
      return [like.setUser(user), comment.addCommentRating(like)];
    });
  };

}).call(this);

//# sourceMappingURL=comment.js.map
