var Model = require('../models/model.js').Model;
var uuid = require('uuid');

exports.post = function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var surname = req.body.surname;
    var about = req.body.about;
    var theme = req.body.theme;
    var language = req.body.language;
    Model.User.findOne({where: {email: email}}).then(function(user){
        if (user)
            return null;
        return Model.User.create({
            authId: uuid.v1(),
            theme: theme,
            language: language,
            firstName: username,
            lastName: surname,
            email: email,
            about: about,
            password: password
        })
    }).then(function(user){
        if (user){
            req.session.user = user.authId;
            res.send(user)
        } else {
            req.session.user = null;
            res.sendStatus(403);
        }
    });
};