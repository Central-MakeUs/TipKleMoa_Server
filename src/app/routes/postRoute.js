module.exports = function (app) {
    const post = require('../controllers/postController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/banners', jwtMiddleware, post.getBanners);
    app.get('/categories/:categoryName/tips', jwtMiddleware, post.getPreviews);
    app.get('/posts', jwtMiddleware, post.getPosts);
    app.post('/posts', jwtMiddleware, post.insertPost);
    app.get('/posts/:postId', jwtMiddleware, post.getPostDetail);
    app.get('/posts/:postId/comments', jwtMiddleware, post.getComments);
    app.post('/posts/:postId/reports', jwtMiddleware, post.insertReport);
    app.post('/posts/comments/:commentId/reports', jwtMiddleware, post.reportComment);
    app.post('/posts/:postId/stars', jwtMiddleware, post.insertStar);
    app.post('/posts/:postId/comments', jwtMiddleware, post.insertComment);
    app.delete('/posts/:postId', jwtMiddleware, post.deletePosts);
    app.delete('/posts/comments/:commentId', jwtMiddleware, post.deleteComment);
};