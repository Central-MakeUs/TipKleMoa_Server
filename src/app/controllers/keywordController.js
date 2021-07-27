const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const keywordDao = require('../dao/keywordDao');


/**
 * API No. 26
 * API Name : 알림 키워드 등록 API
 * [POST] /keywords
 */
 exports.insertKeyword = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const {
                keyword
            } = req.body;

            if (!keyword) return res.json({isSuccess: false, code: 2048, message: "키워드를 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            const keywordRows = await keywordDao.checkUserKeywordExists(connection, userId, keyword);
            if (keywordRows.length !== 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2049,
                    message: "이미 존재하는 키워드입니다.",
                })
            }

            await keywordDao.insertKeyword(connection, userId, keyword);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "키워드 등록 성공",
            })
        } catch (err) {
            connection.release();
            logger.error(`App - insertKeyword DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - insertKeyword Query error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 25
 * API Name : 알림 키워드 조회 API
 * [GET] /keywords
 */
exports.getKeywords = async function (req, res) {

    try {
        try {
            const userId = req.verifiedToken.userId;

            const connection = await pool.getConnection(async (conn) => conn);
            const keywordRows = await keywordDao.getKeywords(connection, userId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "키워드 목록 조회 성공",
                result: keywordRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getKeywords DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getKeywords error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 27
 * API Name : 알림 키워드 삭제 API
 * [DELETE] /keywords/:keywordId
 */
exports.deleteKeyword = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const keywordId = req.params.keywordId;

            if (!keywordId) return res.json({isSuccess: false, code: 2050, message: "keywordId를 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            const keywordRows = await keywordDao.checkKeywordExists(connection, userId, keywordId);
            if (keywordRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2051,
                    message: "존재하지 않거나, 삭제 권한이 없는 키워드입니다.",
                });
            }

            await keywordDao.deleteKeyword(connection, keywordId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "키워드 삭제 성공",
            });
        } catch (err) {
            connection.release();
            logger.error(`App - deleteKeyword DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - deleteKeyword error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};