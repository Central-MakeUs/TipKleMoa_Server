const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const postDao = require('../dao/postDao');
const categoryDao = require('../dao/categoryDao');
const searchDao = require('../dao/searchDao');
const pointDao = require('../dao/pointDao');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const regUrlType = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;


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

exports.getPreviews = async function (req, res) {
    try {
        try {
            const categoryName = req.params.categoryName;
            const {order} = req.query;

            if (!categoryName) {
                return res.json({
                    isSuccess: false,
                    code: 2006,
                    message: "categoryName을 입력해주세요",
                })
            }

            const connection = await pool.getConnection(async (conn) => conn);
            const categoryRows = await categoryDao.checkCategoryExists(connection, categoryName);
            if (categoryRows.length === 0) {
                return res.json({
                    isSuccess: false,
                    code: 2007,
                    message: "존재하지 않는 category",
                })
            }

            const previewRows = await postDao.getPreviews(connection, categoryName, order);
            connection.release();
            if (previewRows == null) {
                return res.json({
                    isSuccess: false,
                    code: 2005,
                    message: "조회 기준이 잘못되었습니다.",
                })
            } else {
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

exports.getPosts = async function (req, res) {
    try {
        try {
            const {categoryName, order, search} = req.query;
            const userId = req.verifiedToken.userId;

            if (!order) {
                return res.json({
                    isSuccess: false,
                    code: 2012,
                    message: "order를 입력해주세요",
                })
            }
            if (!(order === 'recent' || order === 'popular')) {
                return res.json({
                    isSuccess: false,
                    code: 2005,
                    message: "조회 기준이 잘못되었습니다.",
                })
            }

            const connection = await pool.getConnection(async (conn) => conn);
            if (search) {
                const searchRows = await postDao.searchPosts(connection, search, order);
                for(let i=0; i<searchRows.length; i++){
                    const imgRows = await postDao.getPostImages(connection, searchRows[i].postId)
                    const imgList = [];
                    for(let j=0; j<imgRows.length; j++){
                        imgList.push(imgRows[j].imgUrl);
                    }
                    searchRows[i].imgUrl = imgList;
                }

                await searchDao.insertSearchKeyword(connection, userId, search);
                connection.release();

                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "검색 결과 게시물 조회 성공",
                    result: searchRows
                })

            } else if (categoryName) {
                const categoryRows = await categoryDao.checkCategoryExists(connection, categoryName);
                if (categoryRows.length === 0) {
                    connection.release();
                    return res.json({
                        isSuccess: false,
                        code: 2007,
                        message: "존재하지 않는 categoryId",
                    });
                }

                const postRows = await postDao.getPosts(connection, categoryName, order);
                for(let i=0; i<postRows.length; i++){
                    const imgRows = await postDao.getPostImages(connection, postRows[i].postId)
                    const imgList = [];
                    for(let j=0; j<imgRows.length; j++){
                        imgList.push(imgRows[j].imgUrl);
                    }
                    postRows[i].imgUrl = imgList;
                }

                connection.release();
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "카테고리 게시물 조회 성공",
                    result: postRows
                });
            } else {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2006,
                    message: "categoryName 또는 search를 입력해주세요",
                });
            }

        } catch (err) {
            connection.release();
            logger.error(`App - getPosts DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getPosts error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

exports.getPostDetail = async function (req, res) {
    try {
        try {
            const postId = req.params.postId;
            const userId = req.verifiedToken.userId;

            const connection = await pool.getConnection(async (conn) => conn);
            const PostRows = await postDao.checkPostExists(connection, postId);
            if (PostRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                })
            }

            await postDao.addPostHits(connection, userId, postId);

            const postDetailRow = await postDao.getPostDetail(connection, postId, userId);
            const imgRows = await postDao.getPostImages(connection, postDetailRow[0].postId)
            const imgList = [];
            for(let j=0; j<imgRows.length; j++){
                imgList.push(imgRows[j].imgUrl);
            }
            postDetailRow[0].imgUrl = imgList;

            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "게시글 상세 조회 성공",
                result: postDetailRow[0]
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getPostDetail DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getPostDetail error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 12
 * API Name : 게시글 등록 API
 * [POST] /posts
 */
 exports.insertPost = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const {
                category, whenText, howText, description, img
            } = req.body;

            if (!category) return res.json({isSuccess: false, code: 2020, message: "카테고리를 입력해주세요."});
            if (!whenText) return res.json({isSuccess: false, code: 2021, message: "when을 입력해주세요."});
            if (!howText) return res.json({isSuccess: false, code: 2022, message: "how를 입력해주세요."});
            if (!img || img < 1) return res.json({isSuccess: false, code: 2024, message: "이미지 URL을 입력해주세요."});
            if (img > 5) return res.json({isSuccess: false, code: 2025, message: "이미지 URL을 5개 이하로 입력해주세요."});

            for(let i=0; i<img.length; i++) {
                if (!regUrlType.test(img[i][0])) return res.json({
                    isSuccess: false,
                    code: 2026,
                    message: "이미지 URL 형식이 잘못되었습니다."
                });
            }

            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();
            const insertPostRow = await postDao.insertPost(connection, userId, category, whenText, howText, description);

            postId = insertPostRow.insertId;
            let insertImgUrl;
            for(let i=0; i<img.length; i++) {
                insertImgUrl = await postDao.insertImgUrl(connection, postId, img[i][0], img[i][1]);
            }

            // 포인트 적용
            const insertPointRow = await pointDao.insertPoint(connection, userId, 10, "updatePost");

            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "게시글 등록 성공",
                result: {postId: postId}
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - insertPost DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - insertPost Query error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};