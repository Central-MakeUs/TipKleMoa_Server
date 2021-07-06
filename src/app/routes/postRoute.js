module.exports = function(app){
    const post = require('../controllers/postController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/banners', jwtMiddleware, post.getBanners);
    app.get('/categories/:categoryId/tips', jwtMiddleware, post.getPreviews);
    app.get('/posts', jwtMiddleware, post.getPosts);
    app.get('/posts/:postId', jwtMiddleware, post.getPostDetail);
};