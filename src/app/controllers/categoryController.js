const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const categoryDao = require('../dao/categoryDao');

/**
 * API No. 2
 * API Name : 카테고리 목록 조회 API
 * [GET] /categories
 */
exports.getCategories = async function (req, res) {

    try {
        try {
            const connection = await pool.getConnection(async (conn) => conn);
            const categoryRows = await categoryDao.getCategories(connection);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "카테고리 목록 조회 성공",
                result: categoryRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getCategories DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getCategories error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 5
 * API Name : 사용자 관심 카테고리 목록 조회 API
 * [GET] /users/categories
 */
exports.getUserCategories = async function (req, res) {

    try {
        try {
            const userId = req.verifiedToken.userId;
            const connection = await pool.getConnection(async (conn) => conn);
            const categoryRows = await categoryDao.getUserCategories(connection, userId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "사용자 관심 카테고리 목록 조회 성공",
                result: categoryRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getUserCategories DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getUserCategories error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 8
 * API Name : 사용자 관심 카테고리 수정 API
 * [PATCH] /users/categories
 */
exports.updateUserCategory = async function (req, res) {

    try {
        const category = req.body.category;
        if (category.length < 4) return res.json({isSuccess: false, code: 2005, message: "카테고리 개수를 4개 이상으로 선택해주세요."});
        if (category.length > 6) return res.json({isSuccess: false, code: 2006, message: "카테고리 개수를 6개 이하로 선택해주세요."});

        try {
            const userId = req.verifiedToken.userId;
            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction()
            await categoryDao.deleteUserCategory(connection, userId);
            for (let i = 0; i < category.length; i++) {
                await categoryDao.insertUserCategory(connection, userId, category[i]);
            }
            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "사용자 관심 카테고리 수정 성공"
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - updateUserCategories DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - updateUserCategories error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};