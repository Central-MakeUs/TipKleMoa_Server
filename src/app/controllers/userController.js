const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const bookmarkDao = require('../dao/bookmarkDao');
const userDao = require('../dao/userDao');
const { constants } = require('buffer');

const axios = require('axios')
const schedule = require('node-schedule');

/**
 * API No. 1
 * API Name : 카카오 로그인 검증 API
 * [POST] /login/kakao
 */
exports.kakaoLogin = async function (req, res) {
    const {
        accessToken
        // , fcmToken
    } = req.body;

    if (!accessToken) return res.json({isSuccess: false, code: 2001, message: "Access Token을 입력해주세요."});
    // if (!fcmToken) return res.json({isSuccess: false, code: 2002, message: "FCM 토큰을 입력해주세요."});

    try {
        try {
            try {
                kakaoInfo = await axios.get('https://kapi.kakao.com/v2/user/me', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (err) {
                logger.error(`App - Kakao Login error\n: ${JSON.stringify(err)}`);
                return res.json({isSuccess: false, code: 2003, message: "유효하지 않은 Access Token 입니다."});
            }

            const connection = await pool.getConnection(async (conn) => conn);
            const kakaoId = kakaoInfo.data.id;
            const [userByKakaoRows] = await userDao.getUserByKakao(connection, kakaoId);
            connection.release();
            if(userByKakaoRows == undefined) {
                const result = {
                    isMember: 'N',
                    userId: 0,
                    jwt: null
                }

                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "비회원 카카오 로그인 검증 성공",
                    result: result
                })
            } else {
                const userId = userByKakaoRows.userId;

                // fcm 토큰 및 로그인 여부 갱신 코드 필요
        
                // 토큰 생성
                const token = await jwt.sign({
                    userId: userId,
                },
                secret_config.jwtsecret,
                {
                    expiresIn: '365d',
                    subject: 'userId',
                });

                const result = {
                    isMember: 'Y',
                    userId: userId,
                    jwt: token
                }
        
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "회원 카카오 로그인 검증 성공",
                    result: result
                })
            }
        } catch (err) {
            connection.release();
            logger.error(`App - Kakao Login DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - Kakao Login error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 3
 * API Name : 카카오 회원가입 API
 * [POST] /signup/kakao
 */
exports.kakaoSignUp = async function (req, res) {
    const {
        accessToken
        // , fcmToken
        , nickName, category
    } = req.body;

    if (!accessToken) return res.json({isSuccess: false, code: 2001, message: "Access Token을 입력해주세요."});
    // if (!fcmToken) return res.json({isSuccess: false, code: 2002, message: "FCM 토큰을 입력해주세요."});
    if (!nickName) return res.json({isSuccess: false, code: 2004, message: "닉네임을 입력해주세요."});
    if (category.length < 4) return res.json({isSuccess: false, code: 2005, message: "카테고리 개수를 4개 이상으로 선택해주세요."});
    if (category.length > 6) return res.json({isSuccess: false, code: 2006, message: "카테고리 개수를 6개 이하로 선택해주세요."});

    try {
        try {
            try {
                kakaoInfo = await axios.get('https://kapi.kakao.com/v2/user/me', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (err) {
                logger.error(`App - Kakao Login error\n: ${JSON.stringify(err)}`);
                return res.json({isSuccess: false, code: 2003, message: "유효하지 않은 Access Token 입니다."});
            }

            const connection = await pool.getConnection(async (conn) => conn);
            const kakaoId = kakaoInfo.data.id;
            const [userByKakaoRows] = await userDao.getUserByKakao(connection, kakaoId);
            if(userByKakaoRows != undefined) {
                connection.release();
                return res.json({isSuccess: false, code: 2014, message: "이미 가입된 회원입니다."});
            }

            await connection.beginTransaction();
            // 회원 가입 (fcm 토큰 및 로그인 여부 갱신 코드 필요)
            const insertUserInfoByKakaoRow = await userDao.insertUserInfoByKakao(connection, kakaoId, nickName);
            userId = insertUserInfoByKakaoRow.insertId;
            let insertUserCategory;
            for(let i=0; i<category.length; i++) {
                insertUserCategory = await userDao.insertUserCategory(connection, userId, category[i]);
            }
            // 기본 폴더 생성
            await bookmarkDao.addFolder(connection, userId, "기본 폴더");

            // 토큰 생성
            const token = await jwt.sign({
                userId: userId,
            },
            secret_config.jwtsecret,
            {
                expiresIn: '365d',
                subject: 'userId',
            });

            const result = {
                userId: userId,
                jwt: token
            }

            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "카카오 회원가입 성공",
                result: result
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - Kakao SignUp DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - Kakao SignUp Query error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 4
 * API Name : 자동 로그인 API
 * [POST] /auto-login
 */
exports.check = async function (req, res) {
    return res.json({
        isSuccess: true,
        code: 1000,
        message: "JWT 토큰 검증 성공",
    })
};

/**
 * API No. 22
 * API Name : 마이페이지 조회 API
 * [GET] /users/profiles
 */
 exports.getProfile = async function (req, res) {

    try {
        try {
            const userId = req.verifiedToken.userId;
            const connection = await pool.getConnection(async (conn) => conn);
            const [profileRows] = await userDao.getProfile(connection, userId);
            let present;
            let goal;
            if(profileRows.level == 1) {
                present = 0;
                goal = 100;
            } else if(profileRows.level == 2) {
                present = 100;
                goal = 500;
            } else {
                present = 500;
                goal = 1000;
            }
            let rate = Math.floor((profileRows.point - present) / (goal - present) * 100);
            let levelbar;
            if(rate < 20) {
                levelbar = 0;
            } else if(rate < 40) {
                levelbar = 1;
            } else if(rate < 60) {
                levelbar = 2;
            } else if(rate < 80) {
                levelbar = 3;
            } else if(rate < 100) {
                levelbar = 4;
            } else {
                levelbar = 5;
            }
            const result = {
                level: profileRows.level,
                levelName: profileRows.levelName,
                profileImgUrl: profileRows.profileImgUrl,
                nickName: profileRows.nickName,
                levelbar: levelbar,
                achievement: profileRows.point + " / " + goal + "p"
            }
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "마이페이지 조회 성공",
                result: result
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getProfile DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getProfile error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 23
 * API Name : 닉네임 수정 API
 * [PATCH] /users/nickname
 */
 exports.updateNickname = async function (req, res) {

    try {
        const nickName = req.body.nickName;
        if (!nickName) return res.json({isSuccess: false, code: 2004, message: "닉네임을 입력해주세요."});

        try {
            const userId = req.verifiedToken.userId;
            const connection = await pool.getConnection(async (conn) => conn);
            await userDao.updateNickname(connection, userId, nickName);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "닉네임 수정 성공"
            })
        } catch (err) {
            connection.release();
            logger.error(`App - updateNickname DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - updateNickname error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 32
 * API Name : 로그아웃 API
 * [PATCH] /logout
 */
 exports.logout = async function (req, res) {

    try {
        try {
            const userId = req.verifiedToken.userId;
            const token = req.headers['x-access-token'];
            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();
            await userDao.logout(connection, userId);
            await userDao.insertBlacklist(connection, token);
            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "로그아웃 성공"
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - logout DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - logout error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 33
 * API Name : 회원탈퇴 API
 * [DELETE] /users
 */
 exports.deleteUser = async function (req, res) {

    try {
        try {
            const userId = req.verifiedToken.userId;
            const token = req.headers['x-access-token'];
            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();
            await userDao.deleteUser(connection, userId);
            await userDao.insertBlacklist(connection, token);
            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "회원탈퇴 성공"
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - deleteUser DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - deleteUser error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

schedule.scheduleJob('0 0 3 1 * *', async function() {
    console.log('schedule: ' + new Date());
    const connection = await pool.getConnection(async (conn) => conn);
    const deleteBlacklistRows = await userDao.deleteBlacklist(connection);
    connection.release();
});