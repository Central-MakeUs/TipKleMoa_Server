const {pool} = require('./database');
const {logger} = require('./winston');

const jwt = require('jsonwebtoken');
const secret_config = require('./secret');
const userDao = require('../src/app/dao/userDao');
const jwtMiddleware = async function(req, res, next) {
    // read the token from header or url
    const token = req.headers['x-access-token'] || req.query.token;
    // token does not exist
    if(!token) {
        return res.status(403).json({
            isSuccess:false,
            code: 403,
            message: '로그인이 되어 있지 않습니다.'
        });
    }

    // 토큰이 블랙리스트에 있는지 확인
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const [checkBlacklistRows] = await userDao.checkBlacklist(connection, token);
        connection.release();
        if(checkBlacklistRows) {
            return res.status(403).json({
                isSuccess: false,
                code: 403,
                message: "유효하지 않은 토큰입니다."
            })
        }
    } catch (err) {
        connection.release();
        logger.error(`App - checkBlacklist DB Connection error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
    }

    // create a promise that decodes the token
    const p = new Promise(
        (resolve, reject) => {
            jwt.verify(token, secret_config.jwtsecret , (err, verifiedToken) => {
                if(err) reject(err);
                resolve(verifiedToken)
            })
        }
    );

    // if it has failed to verify, it will return an error message
    const onError = (error) => {
        res.status(403).json({
            isSuccess:false,
            code: 403,
            message:"검증 실패"
        });
    };

    // process the promise
    p.then((verifiedToken)=>{
        //비밀 번호 바꼇을 때 검증 부분 추가 할 곳
        req.verifiedToken = verifiedToken;
        next();
    }).catch(onError)
};

module.exports = jwtMiddleware;