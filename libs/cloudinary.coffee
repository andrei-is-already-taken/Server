cloudinary = require('cloudinary')
conf = require('../config')
Promise = require('bluebird')
fs = require('fs')
cloudinary.config
  cloud_name: conf.get('Cloud:name')
  api_key: conf.get('Cloud:key')
  api_secret: conf.get('Cloud:secret')

exports.uploadToCloudinary = (path, callback) ->
  cloudinary.uploader.upload path, callback
  return

exports.uploadBase64 = (base64, user) ->
  if !base64
    base64 = ''
  path = user + '.jpg'
  buff = new Buffer(base64.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64')
  fs.writeFile path, buff
  new Promise((resolve, reject) ->
    cloudinary.uploader.upload path, (upload) ->
      fs.unlink path
      resolve upload
      return
    return
  )

exports.destroy = (publicId) ->
  cloudinary.uploader.destroy publicId
  return