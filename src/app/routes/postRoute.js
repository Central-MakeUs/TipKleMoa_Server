module.exports = function(app){
    const post = require('../controllers/postController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/banners', jwtMiddleware, post.getBanners);
    app.get('/categories/:categoryId/tips', jwtMiddleware, post.getPreviews);
};