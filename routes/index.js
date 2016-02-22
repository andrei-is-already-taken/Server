var passport = require('passport');

module.exports = function(app) {

    app.post('/login', require('./login').post);
    app.post('/registry', require('./registry').post);
    app.post('/logout', require('./logout').post);

    app.post('/post/save', require('./post').post);
    app.get('/post/:id', require('./post').getSpecificPost);
    app.delete('/post/:id', require('./post').delete);
    app.get('/posts/:id', require('./post').allForUser);

    app.get('/tags', require('./post').getTags);
    app.get('/currentUser', require('./user').get);
    app.get('/user/:id', require('./user').getSpecificUser);
    app.get('/ratedarticles', require('./rating').getRatedCreatives);
    app.post('/rate', require('./rating').rateCreative);
    //app.post('/ratecomment', require('./comment').rateComment);
    app.post('/avatar', require('./user').setUserAvatar);

    app.post('/comment/save', require('./comment').post);
    app.post('/comment/all', require('./comment').all);
    app.post('/comment/like', require('./comment').like);

    app.post('/updateuser', require('./user').setThemeAndLang);
    app.post('/update',require('./user').updateUser);

    app.get('/search/:input', require('./search').get);

    app.get('/auth/facebook', passport.authenticate('facebook'));
    app.get('/auth/facebook/callback', passport.authenticate('facebook'), require('./social').log);

    app.get('/auth/vkontakte', passport.authenticate('vkontakte'));
    app.get('/auth/vkontakte/callback', passport.authenticate('vkontakte'), require('./social').log);

    app.get('/auth/twitter', passport.authenticate('twitter'));
    app.get('/auth/twitter/callback', passport.authenticate('twitter'), require('./social').log);
};