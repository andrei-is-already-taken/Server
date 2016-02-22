registrationRedirectPatn = 'http://localhost:8000/app/#/'

exports.post = (req, res) ->
  res.locals.user = null
  req.session.user = null
  res.sendStatus 200
  return