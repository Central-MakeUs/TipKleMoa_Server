module.exports = function(app){
    const post = require('../controllers/postController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/banners', jwtMiddleware, post.getBanners);
};