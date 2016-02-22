var Model = require('../models/model.js').Model;
var Promise = require('bluebird');
var cloudinary = require('../libs/cloudinary');

exports.get = function(req, res, next) {
    //var email =  req.body.email;
    var user = req.session.user;
    Model.User.findOne({where: {authId: user}, include: [Model.Avatar, Model.Medal]})
        .then(function(user) {
            if (user) {
                req.session.user = user.authId;
                res.send(user);
            } else {
                res.sendStatus(403);
            }
        })
};

exports.setThemeAndLang = function (req, res) {
    Model.User.findOne({where: {authId: req.session.user}})
        .then(function (user) {
            if (user) {
                user.theme = req.body.theme;
                user.language = req.body.language;
                return user.save();
            } else {
                res.sendStatus(403);
            }
        })
        .then(function (user) {
            if (user) {
                res.sendStatus(200);
            }
        });
};

exports.updateUser = function (req, res) {
    Model.User.findOne({where:{authId: req.session.user}}).then(function(user){
        return user.update({
            firstName: req.body.firstName || user.firstName,
            lastName: req.body.lastName || user.lastName,
            about: req.body.about || user.about
        })
    }).then(function(result){
        if (result){
            res.sendStatus(200)
        } else {
            res.sendStatus(403)
        }
    })
};

exports.setUserAvatar = function (req, res) {
    var user = Model.User.findOne({where: {authId: req.session.user}});
    var icon = cloudinary.uploadBase64(req.body.img, req.session.user).then(function (upload) {
        return Model.Avatar.create({
            url: upload.url,
            publicId: upload.public_id
        });
    });

    Promise.all([user, icon]).spread(function(user, icon){
        return user.setAvatar(icon);
    }).then(function(result){
        if (result){
            res.sendStatus(200)
        } else {
            res.sendStatus(403)
        }
    });
};

exports.getSpecificUser = function(req, res) {
    Model.User.findOne({where:{id:req.params.id}, include:[Model.Medal]})
        .then(function(user) {
            if (user) {
                res.send(user);
            } else {
                res.sendStatus(403);
            }
        })
};