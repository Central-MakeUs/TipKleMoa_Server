module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/login/kakao', user.kakaoLogin);
    app.post('/signup/kakao', user.kakaoSignUp);
    app.get('/auto-login', jwtMiddleware, user.check);
};