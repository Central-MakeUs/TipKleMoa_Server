module.exports = function(app){
    const keyword = require('../controllers/keywordController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/keywords', jwtMiddleware, keyword.getKeywords);
    app.post('/keywords', jwtMiddleware, keyword.insertKeyword);
    app.delete('/keywords/:keywordId', jwtMiddleware, keyword.deleteKeyword);
};