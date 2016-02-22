Model = require('../models/model.js').Model

module.exports = (req, res, next) ->
  req.user = res.locals.user = null
  if !req.session.user
    return Model.Passport.findOne().then((user) ->
      if user
        req.session.user = user.dataValues.user
        console.log req.session.user
        return user.destroy()
      null
    ).then(->
      next()
    )
  next()
  return