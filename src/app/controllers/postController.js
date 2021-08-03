const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const userDao = require('../dao/userDao');
const postDao = require('../dao/postDao');
const categoryDao = require('../dao/categoryDao');
const searchDao = require('../dao/searchDao');
const pointDao = require('../dao/pointDao');
const bookmarkDao = require('../dao/bookmarkDao');
const keywordDao = require('../dao/keywordDao');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');
const notification = require('../utils/notification');
const slack = require('../utils/slack_report');

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

/**
 * API No.9
 * API Name : 게시물 목록 조회
 * [GET] /posts?categoryName=&order=&search=&page=&limit=
 */
exports.getPosts = async function (req, res) {
    try {
        try {
            const {categoryName, order, search, page, limit} = req.query;
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
            if(!page){
                return res.json({
                    isSuccess: false,
                    code: 2030,
                    message: "page를 입력해주세요.",
                })
            }
            if(!limit){
                return res.json({
                    isSuccess: false,
                    code: 2031,
                    message: "limit을 입력해주세요.",
                })
            }

            const checkNumValid = /^([1-9])+$/;
            if(!checkNumValid.test(page) || !checkNumValid.test(limit)){
                return res.json({
                    isSuccess: false,
                    code: 2032,
                    message: "page, limit은 숫자로 입력해주세요(1 이상)",
                })
            }

            const connection = await pool.getConnection(async (conn) => conn);
            if (search) {
                const searchRows = await postDao.searchPosts(connection, search, userId, order, Number(limit)*(Number(page)-1), Number(limit));
                for(let i=0; i<searchRows.length; i++){
                    const imgRows = await postDao.getPostImages(connection, searchRows[i].postId)
                    const imgList = [];
                    for(let j=0; j<imgRows.length; j++){
                        imgList.push(imgRows[j].imgUrl);
                    }
                    searchRows[i].imgUrl = imgList;
                    if(searchRows[i].userId === userId){
                        searchRows[i].isAuthor = "Y";
                    }
                    else{
                        searchRows[i].isAuthor = "N";
                    }
                }

                await searchDao.insertSearchKeyword(connection, userId, search);
                connection.release();

                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "검색 결과 게시물 조회 성공 - 페이지 : " + page + " 읽은 개수 : " + limit,
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

                const postRows = await postDao.getPosts(connection, categoryName, userId, order, Number(limit)*(Number(page)-1), Number(limit));
                for(let i=0; i<postRows.length; i++){
                    const imgRows = await postDao.getPostImages(connection, postRows[i].postId)
                    const imgList = [];
                    for(let j=0; j<imgRows.length; j++){
                        imgList.push(imgRows[j].imgUrl);
                    }
                    postRows[i].imgUrl = imgList;
                    if(postRows[i].userId === userId){
                        postRows[i].isAuthor = "Y";
                    }
                    else{
                        postRows[i].isAuthor = "N";
                    }
                }

                connection.release();
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "카테고리 게시물 조회 성공 - 페이지 : " + page + " 읽은 개수 : " + limit,
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
            if(!postId){
                return res.json({
                    isSuccess: false,
                    code: 2037,
                    message: "postId를 입력해주세요."
                });
            }
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
            if(userId==postDetailRow[0].userId){
                postDetailRow[0].isAuthor = "Y";
            }
            else{
                postDetailRow[0].isAuthor = "N";
            }
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
                if (!regUrlType.test(img[i])) return res.json({
                    isSuccess: false,
                    code: 2026,
                    message: "이미지 URL 형식이 잘못되었습니다."
                });
            }

            const connection = await pool.getConnection(async (conn) => conn);
            const categoryRows = await categoryDao.checkCategoryExists(connection, category);
            if (categoryRows.length === 0) {
                return res.json({
                    isSuccess: false,
                    code: 2007,
                    message: "존재하지 않는 category",
                })
            }

            await connection.beginTransaction();
            const insertPostRow = await postDao.insertPost(connection, userId, category, whenText, howText, description);

            postId = insertPostRow.insertId;
            let insertImgUrl;
            for(let i=0; i<img.length; i++) {
                insertImgUrl = await postDao.insertImgUrl(connection, postId, img[i]);
            }

            // 포인트 적용
            const insertPointRow = await pointDao.insertPoint(connection, userId, 15, "updatePost");

            await connection.commit();

            const keywordForFcmRows = await keywordDao.getKeywordsForFcm(connection, userId);
            for(let i=0; i<keywordForFcmRows.length; i++) {
                if(whenText.includes(keywordForFcmRows[i].keyword) || howText.includes(keywordForFcmRows[i].keyword)) {
                    notification.notification(`[${keywordForFcmRows[i].keyword} 키워드 알림]`, keywordForFcmRows[i].nickName + "님이 등록한 키워드의 게시물이 새로 올라왔어요🙂", keywordForFcmRows[i].deviceToken, postId.toString());
                }
            }

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

/**
 * API No. 28
 * API Name : 게시물 신고 API
 * [POST] /posts/:postId/reports
 */
 exports.insertReport = async function (req, res) {
    try {
        try {
            const postId = req.params.postId;
            const userId = req.verifiedToken.userId;
            const {
                reason
            } = req.body;

            if (!postId) return res.json({isSuccess: false, code: 2037, message: "postId를 입력해주세요."});
            if (!reason) return res.json({isSuccess: false, code: 2027, message: "신고 사유를 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();
            const postRows = await postDao.checkPostExists(connection, postId);
            if (postRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                })
            }
            const insertReportRow = await postDao.insertReport(connection, userId, postId, reason);

            // 포인트 적용
            const insertPointRow = await pointDao.insertPoint(connection, userId, 5, "reportPost");
            await connection.commit();
            connection.release();
            await slack.send_report("post", userId, postId, reason);
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "게시글 신고 성공"
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - insertReport DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - insertReport error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 38
 * API Name : 댓글 신고 API
 * [POST] /posts/comments/:commentId/reports
 */
exports.reportComment = async function (req, res) {
    try {
        try {
            const commentId = req.params.commentId;
            const userId = req.verifiedToken.userId;
            const {
                reason
            } = req.body;

            if (!commentId) return res.json({isSuccess: false, code: 2046, message: "commentId를 입력해주세요."});
            if (!reason) return res.json({isSuccess: false, code: 2027, message: "신고 사유를 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();
            const commentRows = await postDao.checkCommentValid(connection, commentId);
            if (commentRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2052,
                    message: "존재하지 않는 commentId",
                })
            }
            const insertReportRow = await postDao.reportComment(connection, userId, commentId, reason);

            // 포인트 적용
            const insertPointRow = await pointDao.insertPoint(connection, userId, 5, "reportComment");
            await connection.commit();
            connection.release();
            await slack.send_report("comment", userId, commentId, reason);
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "댓글 신고 성공"
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - reportComment DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - reportComment error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No.34
 * API Name : 게시글 삭제 API
 * [DELETE] /posts/:postId
 */
exports.deletePosts = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const postId = req.params.postId;
            if(!postId){
                return res.json({
                    isSuccess: false,
                    code: 2037,
                    message: "postId를 입력해주세요."
                });
            }
            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();

            const postRows = await postDao.checkPostExists(connection, postId);
            if (postRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                });
            }
            const authorRows = await postDao.checkPostAuthor(connection, postId, userId);
            if (authorRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2041,
                    message: "게시글 삭제 권한이 없습니다.",
                });
            }

            await bookmarkDao.deletePostsFromAllFolder(connection, postId);
            await postDao.deletePosts(connection, postId);
            await pointDao.insertPoint(connection, userId, -15 , "deletePost");

            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "게시글 삭제 성공"
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - deletePosts DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - deletePosts error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 21
 * API Name : 별점 등록/수정 API
 * [POST] /posts/:postId/stars
 */
 exports.insertStar = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const postId = req.params.postId;
            const {
                star
            } = req.body;

            if (!postId) return res.json({isSuccess: false, code: 2037, message: "postId를 입력해주세요."});
            if (!star) return res.json({isSuccess: false, code: 2042, message: "별점을 입력해주세요."});
            if (!Number.isInteger(star) || star < 1 || star > 5) return res.json({isSuccess: false, code: 2043, message: "별점은 1이상 5이하의 정수만 가능합니다."});

            const connection = await pool.getConnection(async (conn) => conn);
            const postRows = await postDao.checkPostExists(connection, postId);
            if (postRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                })
            }

            const starRows = await postDao.checkStarExists(connection, userId, postId);
            if(starRows.length === 0) {
                await connection.beginTransaction();
                await postDao.insertStar(connection, userId, postId, star);

                // 포인트 적용
                const insertPointRow = await pointDao.insertPoint(connection, userId, 6, "postStarred");
                await connection.commit();
                connection.release();
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "별점 등록 성공",
                })
            } else {
                await postDao.updateStar(connection, userId, postId, star);
                connection.release();
                return res.json({
                    isSuccess: true,
                    code: 1000,
                    message: "별점 수정 성공",
                })
            }
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - insertStar DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - insertStar Query error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 30
 * API Name : 댓글 등록 API
 * [POST] /posts/:postId/comments
 */
 exports.insertComment = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const postId = req.params.postId;
            const {
                content
            } = req.body;

            if (!postId) return res.json({isSuccess: false, code: 2037, message: "postId를 입력해주세요."});
            if (!content) return res.json({isSuccess: false, code: 2044, message: "댓글을 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            await connection.beginTransaction();
            const postRows = await postDao.checkPostExists(connection, postId);
            if (postRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                })
            }

            await postDao.insertComment(connection, userId, postId, content);

            // 포인트 적용
            const insertPointRow = await pointDao.insertPoint(connection, userId, 6, "postCommented");
            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "댓글 등록 성공",
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - insertComment DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - insertComment Query error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 31
 * API Name : 특정 게시글 댓글 조회 API
 * [GET] /posts/:postId/comments
 */
exports.getComments = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const postId = req.params.postId;

            if (!postId) return res.json({isSuccess: false, code: 2037, message: "postId를 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            const postRows = await postDao.checkPostExists(connection, postId);
            if (postRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                })
            }

            const commentRows = await postDao.getComments(connection, userId, postId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "댓글 조회 성공",
                result: commentRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getComments DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getComments error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 36
 * API Name : 댓글 삭제 API
 * [DELETE] /posts/comments/:commentId
 */
exports.deleteComment = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const commentId = req.params.commentId;

            if (!commentId) return res.json({isSuccess: false, code: 2046, message: "commentId를 입력해주세요."});

            const connection = await pool.getConnection(async (conn) => conn);
            const commentRows = await postDao.checkCommentExists(connection, userId, commentId);
            if (commentRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2047,
                    message: "존재하지 않거나, 삭제 권한이 없는 댓글입니다.",
                });
            }
            await connection.beginTransaction();
            await postDao.deleteComment(connection,commentId);
            await pointDao.insertPoint(connection, userId, -6 , "deleteComment");

            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "댓글 삭제 성공",
            });
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - deleteComment DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - deleteComment error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};
