const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const searchDao = require('../dao/searchDao');

/**
 * API No. 11
 * API Name : 검색어 목록 조회 API
 * [GET] /search
 */
exports.getSearch = async function (req, res) {
    try {
        const userId = req.verifiedToken.userId;
        const order = req.query.order
        if (!order) return res.json({isSuccess: false, code: 2012, message: "order는 반드시 파라미터로 넘겨줘야 하는 값입니다."});
        if (!(order == 'recent' || order == 'popular')) return res.json({
            isSuccess: false,
            code: 2013,
            message: "order 값이 옳지 않습니다."
        });

        try {
            const connection = await pool.getConnection(async (conn) => conn);
            const searchRows = await searchDao.getSearch(connection, userId, order);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "검색어 목록 조회 성공",
                result: searchRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getSearch DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getSearch error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};