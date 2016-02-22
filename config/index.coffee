nconf = require('nconf')
path = require('path')
#nconf.argv().env().file file: path.join(__dirname, 'config.json')
nconf.argv().env().file file: path.join(__dirname, '/../js/config/config.json')
module.exports = nconf