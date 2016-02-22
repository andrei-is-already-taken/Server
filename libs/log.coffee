winston = require('winston')
ENV = process.env.NODE_ENV

getLogger = (module) ->
  path = module.filename.split('/').slice(-2).join('/')
  new (winston.Logger)(transports: [ new (winston.transports.Console)(
    colorize: true
    level: if ENV == 'development' then 'debug' else 'error'
    label: path) ])

module.exports = getLogger