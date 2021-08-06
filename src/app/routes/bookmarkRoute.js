module.exports = function (app) {
    const bookmark = require('../controllers/bookmarkController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/bookmarks', jwtMiddleware, bookmark.getBookmarks);
    app.post('/folders', jwtMiddleware, bookmark.addFolder);
    app.post('/folders/:folderId/posts', jwtMiddleware, bookmark.addPostToFolder);
    app.get('/folders', jwtMiddleware, bookmark.getFolderList);
    app.delete('/folders/posts/:postId', jwtMiddleware, bookmark.deletePostFromFolder);
    app.delete('/folders/:folderId', jwtMiddleware, bookmark.deleteFolder);
    app.get('/folders/:folderId/posts', jwtMiddleware, bookmark.getFolderPosts);
};