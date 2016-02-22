var async = require('async');
var conf = require('../config');
var util = require('util');
var Promise = require('bluebird');
var Sequelize = require('sequelize');
var cloudinary = require('../libs/cloudinary');

Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};
DestroyTags = function (creative) {
    var creativeTags = creative.getTags();
    var allTags = Model.Tag.findAll();
    return Promise.all([creativeTags, allTags])
        .spread(function (creativeTags, allTags) {
            var creativeIds = creativeTags.map(function (tag) {
                return tag.id
            });
            var allIds = allTags.map(function (tag) {
                return tag.id
            });
            var diff = allIds.diff(creativeIds);
            var toDelete = creativeIds.diff(diff);
            return Model.Tag.destroy({ where: {id: toDelete}});
        });
};

var sequelize = new Sequelize(conf.get('DB:table'), conf.get('DB:user'), conf.get('DB:password'), {
    host: conf.get('DB:host'),
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

var Creative = sequelize.define('creative', {
        category: Sequelize.STRING,
        title: Sequelize.STRING,
        description: Sequelize.TEXT,
        article: Sequelize.TEXT,
        template: Sequelize.TEXT,
        imageLink: Sequelize.STRING,
        videoLink: Sequelize.STRING,
        map: Sequelize.ARRAY(Sequelize.DECIMAL),
        url: Sequelize.STRING,
        publicId: Sequelize.STRING
    },
    {
        hooks: {
            beforeDestroy: function (creative) {
                cloudinary.destroy(creative.url);
                DestroyTags(creative);
            }
        }
    });

var Avatar = sequelize.define('avatar', {
    url: Sequelize.STRING,
    publicId: Sequelize.STRING
});

var Category = sequelize.define('category', {
    name: Sequelize.TEXT
});
var Tag = sequelize.define('tag', {
    name: Sequelize.STRING
});
var User = sequelize.define('user', {
    authId: Sequelize.STRING,
    password: Sequelize.STRING,
    theme: {type: Sequelize.STRING, defaultValue: 'light'},
    language: {type: Sequelize.STRING, defaultValue: 'en'},
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    about: Sequelize.STRING,
    rating: {type: Sequelize.DECIMAL, defaultValue: 0},
    email: {
        type: Sequelize.STRING
    }
});

var Rating = sequelize.define('rating', {
    score: Sequelize.INTEGER
});
var CreativeRating = sequelize.define('CreativeRating', {
    score: Sequelize.INTEGER
});
var UserRating = sequelize.define('user_rating', {
    score: Sequelize.INTEGER
});

var Comment = sequelize.define('comment', {
    body: Sequelize.TEXT
});
var CommentRating = sequelize.define('CommentRating', {});
var Medal = sequelize.define('medal', {
    name: Sequelize.TEXT,
    level: Sequelize.INTEGER,
    link: Sequelize.STRING
});

User.hasMany(Creative);


Creative.belongsToMany(Tag, {through: "CreativeTag"});
Tag.belongsToMany(Creative, {through: "CreativeTag"});

//Creative.belongsTo(Category);

User.belongsToMany(Medal, {through: "UserMedal"});
Medal.belongsToMany(User, {through: "UserMedal"});

//CreativeRating.belongsTo(User);
User.hasMany(CreativeRating);
Creative.hasMany(CreativeRating);

Creative.hasMany(Comment);
Comment.belongsTo(User);

User.hasOne(Avatar);

CommentRating.belongsTo(User);
Comment.hasMany(CommentRating);

User.hasOne(Avatar);


var Model = {
    Comment: Comment,
    Rating: Rating,
    CommentRating: CommentRating,
    Creative: Creative,
    User: User,
    Medal: Medal,
    Category: Category,
    Tag: Tag,
    Avatar: Avatar,
    CreativeRating: CreativeRating,
    AddScores: function (creatives, ratings) {
        var sums = ratings.map(function (ratings) {
            var sum = 0;
            ratings.forEach(function (rating) {
                sum += rating.score;
            });
            return sum;
        });
        for (var i = 0; i < creatives.length; i++) {
            creatives[i].dataValues.score = sums[i];
        }
        return creatives;
    },
    AddRatables: function (creatives, user) {
        if(!user) return creatives;
        var allRatings = Promise.all(creatives.map(function (creative) {
            return creative.getCreativeRatings();
        }));
        return allRatings.then(function (allRatings) {
            for (var i = 0; i < allRatings.length; i++) {
               // console.log("allRating", allRatings[i])
                var alreadyRated = allRatings[i].some(function (rating) {
                    return rating.dataValues.userId == user.id;});
                creatives[i].dataValues.ratable = !alreadyRated;
                //console.log(creatives[i]);
            }
            console.log("ADDED RATABLESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS");
            return creatives;
        });
    },
    AddUsers: function (creatives) {
        var userPromises = creatives.map(function (creative) {
            return Model.User.findById(creative.userId)
        });
        return new Promise(function (resolve, reject) {
            return Promise.all(userPromises).then(function (users) {
                for (var i = 0; i < creatives.length; i++) {
                    creatives[i].dataValues.user = users[i].dataValues;
                }
            }).then(function () {
                resolve(creatives)
            });
        })
    },
    AddTags: function (creatives) {
        var tagsPromises = creatives.map(function (creative) {
            return creative.getTags();
        });
        return new Promise(function (resolve, reject) {
            return Promise.all(tagsPromises)
                .then(function (tags) {
                    for (var i = 0; i < creatives.length; i++) {
                        var tagValues = tags[i].map(function (tag) {
                            return tag.dataValues
                        });
                        creatives[i].dataValues.tags = tagValues;
                    }
                }).then(function () {
                    resolve(creatives);
                });
        });
    },
    DestroyTags: DestroyTags
};

sequelize.sync({});
    //.then(function () {
//    return Promise.all([
//            Model.Medal.create({
//                name: 'bestPost',
//                level: 1,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/bronze_best_post_xcxbwo.png'
//            }), Model.Medal.create({
//                name: 'bestPost',
//                level: 2,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990169/silver_best_post_cnflug.png'
//            }), Model.Medal.create({
//                name: 'bestPost',
//                level: 3,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/gold_best_post_qa8uax.png'
//            }), Model.Medal.create({
//                name: 'badPost',
//                level: 1,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/bronze_worst_post_ylbodc.png'
//            }), Model.Medal.create({
//                name: 'badPost',
//                level: 2,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990169/silver_worst_post_p2f8tb.png'
//            }), Model.Medal.create({
//                name: 'badPost',
//                level: 3,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990169/gold_worst_post_tqi1kw.png'
//            }), Model.Medal.create({
//                name: '100posts',
//                level: 3,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/100_posts_gold_ecq3bg.png'
//            }), Model.Medal.create({
//                name: 'firstPost',
//                level: 3,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990168/first_post_gold_gu5mpt.png'
//            }), Model.Medal.create({
//                name: 'topRating',
//                level: 1,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/best_user_bronze_ddumqi.png'
//            }), Model.Medal.create({
//                name: 'topRating',
//                level: 2,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/best_user_silver_gg6lr3.png'
//            }),  Model.Medal.create({
//                name: 'topRating',
//                level: 3,
//                link: 'http://res.cloudinary.com/doz0bmuqp/image/upload/v1455990167/best_user_gold_rabmmk.png'
//            })])});

exports.Model = Model;
