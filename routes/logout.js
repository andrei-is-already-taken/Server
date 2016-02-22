var registrationRedirectPatn = "http://localhost:8000/app/#/";

exports.post = function(req, res) {
  res.locals.user = null;
  req.session.user = null;
  res.sendStatus(200);
};
