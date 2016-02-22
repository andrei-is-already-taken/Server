module.exports = function( req, res, next ) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control");
    res.header("Access-Control-Allow-Headers", "Content-Type, *");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Credentials", true);
    next();
};