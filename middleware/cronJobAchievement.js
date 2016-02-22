var CronJob = require('cron').CronJob;
var Model = require('../models/model.js').Model;
var Promise = require('bluebird');

var jobWeek = new CronJob('*/10 * * * * *', function() { //'* * * * * 1'
    var users = Model.User.findAll();

    var creativesWitnRating = users.map(function(user){
        return getCreativesWitnRatingForUser(user);
    });

    return Promise.all([creativesWitnRating, users]).spread(function(creatives, users){
        var temp = [].concat.apply([], creatives);
        var result = [].concat.apply([], temp);
        var userArray = [].concat.apply([], users);
        return [result.sort(compareCreatives), userArray.sort(compareUsers)];
    }).spread(function(result, users){
        var firstSet = setMedalsForCreatives("badPost", arrayFrom(result));
        var secondSet = setMedalsForCreatives("bestPost", arrayFrom(result.reverse()));
        var topUsersArr = topUsers(users);
        var userSet = topUsersArr.map(function (user) {
            return setMedalForUser("topRating", user);
        });
        return Promise.all([firstSet, secondSet, userSet]).then(function(){
            return null
        });
    })
}, function () {}, true);


var jobDay = new CronJob('*/10 * * * * *', function() {    //'0 0 */23 * * *'
    var users = Model.User.findAll();

    var hundredPosts = users.map(function(user){
        return user.getCreatives().then(function(creatives){
            if (creatives.length){
                var setfirst = setMedalForUser("firstPost", user)
            }
            if (creatives.length >= 100){
                var setHundred = setMedalForUser("100posts", user);
            }
            return Promise.all([setfirst, setHundred])
        });
    });
    return Promise.all([hundredPosts]).spread(function(){
        return null
    });
}, function(){}, true);

var jobHour = new CronJob('*/5 * * * * *', function() {        //'0 */59 * * * *'
    var users = Model.User.findAll();

    var rating = users.map(function(user){
        return getCreativesWitnRatingForUser(user).then(function(creatives){
            var rating = 0;
            return Promise.all(creatives.map(function(creative){
                return rating += creative.dataValues.score;
            })).then(function(){
                if (creatives.length){
                    rating /= creatives.length;
                }
                user.update({rating: rating})
            });
        });
    });

    return Promise.all([rating]).spread(function(){
        return null
    });
}, function(){}, true);

function getCreativesWitnRatingForUser(user) {
    return user.getCreatives().then(function (creatives) {
        var ratings = Promise.all(creatives.map(function (creative) {
            return creative.getCreativeRatings();
        }));
        return [creatives, ratings];
    }).spread(Model.AddScores)
}

function compareCreatives(a,b) {
    if (a.dataValues.score < b.dataValues.score)
        return -1;
    else if (a.dataValues.score > b.dataValues.score)
        return 1;
    else
        return 0;
}

function compareUsers(a,b) {
    if (a.dataValues.rating < b.dataValues.rating)
        return -1;
    else if (a.dataValues.rating > b.dataValues.rating)
        return 1;
    else
        return 0;
}

function topUsers(arr) {
    if (arr.length){
        arr.reverse();
        var value = arr[0].dataValues.rating;
    }
    var resultArray = [];
    for(var i = 0; i < arr.length; i++)
        if (arr[i].dataValues.rating == value)
            resultArray.push(arr[i]);
        else break;
    return resultArray;
}

function arrayFrom(arr) {
    if (arr.length){
        var value = arr[0].dataValues.score;
    }
    var resultArray = [];
    for(var i = 0; i < arr.length; i++)
        if (arr[i].dataValues.score == value)
            resultArray.push(arr[i]);
        else break;
    return resultArray;
}

function getNextLevel(medals) {
    var level = 1;
    for(var i = 0; i < medals.length; i++) {
        if (medals[i].dataValues.level == 3){
            return null
        } else {
            level = medals[i].dataValues.level + 1;
        }
    }
    return level;
}

function setMedalsForCreatives(medalName, creatives) {
    return Promise.all(creatives.map(function(creative){
        return Model.User.findById(creative.dataValues.userId).then(function(user){
            return setMedalForUser(medalName, user);
        });
    }));
}

function setMedalForUser(medalName, user){
    return user.getMedals({where:{name:medalName}}).then(function(medals){
        var level = getNextLevel(medals, medalName);
        if (level && (level <= 3)){
            if ((medalName == "firstPost") || (medalName == "100Posts"))
                level = 3;
            console.log("USER ", user.dataValues.firstName, " GET MEDAL ", medalName, " OF LEVEL ", level);
            return Model.Medal.findOne({where: {name:medalName, level: level}}).then(function(medal){
                return user.addMedal(medal);
            })
        }
        return null;
    });
}