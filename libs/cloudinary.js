var cloudinary = require('cloudinary');
var conf = require('../config');
var Promise = require('bluebird');
var fs = require('fs');

cloudinary.config({
    cloud_name: conf.get('Cloud:name'),
    api_key: conf.get('Cloud:key'),
    api_secret: conf.get('Cloud:secret')
});

exports.uploadToCloudinary = function(path, callback) {
    cloudinary.uploader.upload(path, callback);
};

exports.uploadBase64 = function(base64, user) {
     if (!base64) base64 = '';
    var path = user + '.jpg';
    var buff = new Buffer(base64.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64');
    fs.writeFile(path, buff);
    return new Promise(function (resolve, reject) {
        cloudinary.uploader.upload(path, function (upload) {
            fs.unlink(path);
            resolve(upload);
        });
    })
};

exports.destroy = function(publicId) {
    cloudinary.uploader.destroy(publicId);
};
