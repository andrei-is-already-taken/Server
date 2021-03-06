// Generated by CoffeeScript 1.10.0
(function() {
  var CronJob, Model, Promise, arrayFrom, compareCreatives, compareUsers, getCreativesWitnRatingForUser, getNextLevel, jobDay, jobHour, jobWeek, setMedalForUser, setMedalsForCreatives, topUsers;

  CronJob = require('cron').CronJob;

  Model = require('../models/model.js').Model;

  Promise = require('bluebird');

  jobWeek = new CronJob('*/10 * * * * *', (function() {
    var creativesWitnRating, users;
    users = Model.User.findAll();
    creativesWitnRating = users.map(function(user) {
      return getCreativesWitnRatingForUser(user);
    });
    return Promise.all([creativesWitnRating, users]).spread(function(creatives, users) {
      var result, temp, userArray;
      temp = [].concat.apply([], creatives);
      result = [].concat.apply([], temp);
      userArray = [].concat.apply([], users);
      return [result.sort(compareCreatives), userArray.sort(compareUsers)];
    }).spread(function(result, users) {
      var firstSet, secondSet, topUsersArr, userSet;
      firstSet = setMedalsForCreatives('badPost', arrayFrom(result));
      secondSet = setMedalsForCreatives('bestPost', arrayFrom(result.reverse()));
      topUsersArr = topUsers(users);
      userSet = topUsersArr.map(function(user) {
        return setMedalForUser('topRating', user);
      });
      return Promise.all([firstSet, secondSet, userSet]).then(function() {
        return null;
      });
    });
  }), (function() {}), true);

  jobDay = new CronJob('*/10 * * * * *', (function() {
    var hundredPosts, users;
    users = Model.User.findAll();
    hundredPosts = users.map(function(user) {
      return user.getCreatives().then(function(creatives) {
        var setHundred, setfirst;
        if (creatives.length) {
          setfirst = setMedalForUser('firstPost', user);
        }
        if (creatives.length >= 100) {
          setHundred = setMedalForUser('100posts', user);
        }
        return Promise.all([setfirst, setHundred]);
      });
    });
    return Promise.all([hundredPosts]).spread(function() {
      return null;
    });
  }), (function() {}), true);

  jobHour = new CronJob('*/5 * * * * *', (function() {
    var rating, users;
    users = Model.User.findAll();
    rating = users.map(function(user) {
      return getCreativesWitnRatingForUser(user).then(function(creatives) {
        var rating;
        rating = 0;
        return Promise.all(creatives.map(function(creative) {
          return rating += creative.dataValues.score;
        })).then(function() {
          if (creatives.length) {
            rating /= creatives.length;
          }
          user.update({
            rating: rating
          });
        });
      });
    });
    return Promise.all([rating]).spread(function() {
      return null;
    });
  }), (function() {}), true);

  getCreativesWitnRatingForUser = function(user) {
    return user.getCreatives().then(function(creatives) {
      var ratings;
      ratings = Promise.all(creatives.map(function(creative) {
        return creative.getCreativeRatings();
      }));
      return [creatives, ratings];
    }).spread(Model.AddScores);
  };

  compareCreatives = function(a, b) {
    if (a.dataValues.score < b.dataValues.score) {
      return -1;
    } else if (a.dataValues.score > b.dataValues.score) {
      return 1;
    } else {
      return 0;
    }
  };

  compareUsers = function(a, b) {
    if (a.dataValues.rating < b.dataValues.rating) {
      return -1;
    } else if (a.dataValues.rating > b.dataValues.rating) {
      return 1;
    } else {
      return 0;
    }
  };

  topUsers = function(arr) {
    var i, resultArray, value;
    if (arr.length) {
      arr.reverse();
      value = arr[0].dataValues.rating;
    }
    resultArray = [];
    i = 0;
    while (i < arr.length) {
      if (arr[i].dataValues.rating === value) {
        resultArray.push(arr[i]);
      } else {
        break;
      }
      i++;
    }
    return resultArray;
  };

  arrayFrom = function(arr) {
    var i, resultArray, value;
    if (arr.length) {
      value = arr[0].dataValues.score;
    }
    resultArray = [];
    i = 0;
    while (i < arr.length) {
      if (arr[i].dataValues.score === value) {
        resultArray.push(arr[i]);
      } else {
        break;
      }
      i++;
    }
    return resultArray;
  };

  getNextLevel = function(medals) {
    var i, level;
    level = 1;
    i = 0;
    while (i < medals.length) {
      if (medals[i].dataValues.level === 3) {
        return null;
      } else {
        level = medals[i].dataValues.level + 1;
      }
      i++;
    }
    return level;
  };

  setMedalsForCreatives = function(medalName, creatives) {
    return Promise.all(creatives.map(function(creative) {
      return Model.User.findById(creative.dataValues.userId).then(function(user) {
        return setMedalForUser(medalName, user);
      });
    }));
  };

  setMedalForUser = function(medalName, user) {
    return user.getMedals({
      where: {
        name: medalName
      }
    }).then(function(medals) {
      var level;
      level = getNextLevel(medals, medalName);
      if (level && level <= 3) {
        if (medalName === 'firstPost' || medalName === '100Posts') {
          level = 3;
        }
        console.log('USER ', user.dataValues.firstName, ' GET MEDAL ', medalName, ' OF LEVEL ', level);
        return Model.Medal.findOne({
          where: {
            name: medalName,
            level: level
          }
        }).then(function(medal) {
          return user.addMedal(medal);
        });
      }
      return null;
    });
  };

}).call(this);

//# sourceMappingURL=cronJobAchievement.js.map
