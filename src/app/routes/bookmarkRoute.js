module.exports = function(app){
    const bookmark = require('../controllers/bookmarkController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/bookmarks', jwtMiddleware, bookmark.getBookmarks);
    app.post('/folders', jwtMiddleware, bookmark.addFolder);
    app.post('/folders/:folderId/posts', jwtMiddleware, bookmark.addPostToFolder);
    app.get('/folders/posts/:postId', jwtMiddleware, bookmark.getFolders);
    app.delete('/folders/:folderId/posts/:postId', jwtMiddleware, bookmark.deletePostFromFolder);
    app.delete('/folders/:folderId', jwtMiddleware, bookmark.deleteFolder);
};