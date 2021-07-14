module.exports = function(app){
    const bookmark = require('../controllers/bookmarkController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/bookmarks', jwtMiddleware, bookmark.getBookmarks);
    app.post('/folders', jwtMiddleware, bookmark.addFolder);
};