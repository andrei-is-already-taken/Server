var registrationRedirectPath = 'http://localhost:8000/app/#/';

exports.log = function(req, res) {
    console.log(req.sessionID);
    req.session.user = req.user.dataValues.authId;
    res.redirect(registrationRedirectPath);
};