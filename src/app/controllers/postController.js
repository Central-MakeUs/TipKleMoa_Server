const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const postDao = require('../dao/postDao');
const categoryDao = require('../dao/categoryDao');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');


/**
 * API No.6
 * API Name : 배너 목록 조
 * [GET] /banners
 */
exports.getBanners = async function (req, res) {
    try {
        try {
            const connection = await pool.getConnection(async (conn) => conn);
            const bannerRows = await postDao.getBanners(connection);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "배너 조회 성공",
                result: bannerRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getBanners DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getBanners error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

exports.getPreviews = async function (req, res){
    try {
        try {
            const categoryId = req.params.categoryId;
            const {order} = req.query;

            if (!categoryId){
                return res.json({
                    isSuccess: false,
                    code: 2006,
                    message: "categoryId를 입력해주세요",
                })
            }

            const connection = await pool.getConnection(async (conn) => conn);
            const categoryRows = await categoryDao.checkCategoryExists(connection, categoryId);
            if(categoryRows.length===0){
                return res.json({
                    isSuccess: false,
                    code: 2007,
                    message: "존재하지 않는 categoryId",
                })
            }

            const previewRows = await postDao.getPreviews(connection, categoryId, order);
            connection.release();
            if (previewRows==null){
                return res.json({
                    isSuccess: false,
                    code: 2005,
                    message: "조회 기준이 잘못되었습니다.",
                })
            }
            else{
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "미리보기 조회 성공",
                    result: previewRows
                })
            }
        } catch (err) {
            connection.release();
            logger.error(`App - getPreviews DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getPreviews error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};