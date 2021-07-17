module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/login/kakao', user.kakaoLogin);
    app.post('/signup/kakao', user.kakaoSignUp);
    app.get('/auto-login', jwtMiddleware, user.check);
    app.get('/users/profiles', jwtMiddleware, user.getProfile);
    app.patch('/users/nickname', jwtMiddleware, user.updateNickname);
    app.patch('/logout', jwtMiddleware, user.logout);
    app.delete('/users', jwtMiddleware, user.deleteUser);
};