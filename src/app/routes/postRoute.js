module.exports = function(app){
    const post = require('../controllers/postController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/banners', jwtMiddleware, post.getBanners);
    app.get('/categories/:categoryName/tips', jwtMiddleware, post.getPreviews);
    app.get('/posts', jwtMiddleware, post.getPosts);
    app.post('/posts', jwtMiddleware, post.insertPost);
    app.get('/posts/:postId', jwtMiddleware, post.getPostDetail);
};