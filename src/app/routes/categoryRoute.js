module.exports = function(app){
    const category = require('../controllers/categoryController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/categories', category.getCategories);
    app.get('/users/categories', jwtMiddleware, category.getUserCategories);
    app.patch('/users/categories', jwtMiddleware, category.updateUserCategory);
};