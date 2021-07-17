const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const bookmarkDao = require('../dao/bookmarkDao');
const postDao = require('../dao/postDao');

/**
 * API No. 13
 * API Name : 북마크 화면 조회 API
 * [GET] /bookmarks
 */
exports.getBookmarks = async function (req, res) {

    try {
        try {
            const userId = req.verifiedToken.userId;
            const connection = await pool.getConnection(async (conn) => conn);
            let folderRows = await bookmarkDao.getFolders(connection, userId);
            for(let i=0; i<folderRows.length; i++) {
                let postRows = await bookmarkDao.getFolderPostsPreview(connection, folderRows[i].folderId);
                folderRows[i].postsInfo = postRows;
            }
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "북마크 목록 조회 성공",
                result: folderRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getBookmarks DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getBookmarks error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 14
 * API Name : 폴더 생성 API
 * [POST] /folders
 */
exports.addFolder = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const connection = await pool.getConnection(async (conn) => conn);
            const { folderName } = req.body;
            if(!folderName){
                return res.json({
                    isSuccess: false,
                    code: 2035,
                    message: "folderName을 입력해주세요."
                });
            }
            const folderRows = await bookmarkDao.addFolder(connection, userId, folderName);

            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "폴더 생성 성공",
                result: folderRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - addFolder DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - addFolder error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 16
 * API Name : 게시물 폴더 저장 API
 * [POST] /folders/:folderId/posts
 */
exports.addPostToFolder = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const folderId = req.params.folderId;
            const { postId } = req.body;
            if(!folderId){
                return res.json({
                    isSuccess: false,
                    code: 2036,
                    message: "folderId를 입력해주세요."
                });
            }
            if(!postId){
                return res.json({
                    isSuccess: false,
                    code: 2037,
                    message: "postId를 입력해주세요."
                });
            }

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
            const folderRows = await bookmarkDao.checkFolderExists(connection, folderId, userId);
            if(folderRows.length === 0){
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2038,
                    message: "존재하지 않는 folderId",
                })
            }
            const folderPostRows = await bookmarkDao.checkFolderPostExists(connection, userId, postId);
            if(folderPostRows.length > 0){
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2039,
                    message: "이미 저장된 postId",
                })
            }

            await bookmarkDao.addPostToFolder(connection, folderId, postId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "게시물 폴더 저장 성공",
            })
        } catch (err) {
            connection.release();
            logger.error(`App - addPostToFolder DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - addPostToFolder error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 15
 * API Name : 폴더 목록 조회 API
 * [GET] /folders
 */
exports.getFolderList = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;

            const connection = await pool.getConnection(async (conn) => conn);
            const folderRows = await bookmarkDao.getFolderList(connection, userId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "폴더 목록 조회 성공",
                result: folderRows
            })
        } catch (err) {
            connection.release();
            logger.error(`App - getFolders DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getFolders error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 20
 * API Name : 게시물 저장 취소 API
 * [DELETE] /folders/posts/:postId
 */
exports.deletePostFromFolder = async function (req, res) {
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
            const postRows = await postDao.checkPostExists(connection, postId);
            if (postRows.length === 0) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2008,
                    message: "존재하지 않는 postId",
                })
            }
            const folderPostRows = await bookmarkDao.checkFolderPostExists(connection, userId, postId);
            if(folderPostRows.length === 0){
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2040,
                    message: "폴더에 해당 게시물이 존재하지 않습니다.",
                })
            }
            const folderId = folderPostRows[0].folderId;
            await bookmarkDao.deletePostFromFolder(connection, folderId, postId);
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "게시물 저장 취소 성공",
            })
        } catch (err) {
            connection.release();
            logger.error(`App - deletePostFromFolder DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - deletePostFromFolder error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
 * API No. 19
 * API Name : 폴더 삭제 API
 * [DELETE] /folders/:folderId
 */
exports.deleteFolder = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const folderId = req.params.folderId;
            if(!folderId){
                return res.json({
                    isSuccess: false,
                    code: 2036,
                    message: "folderId를 입력해주세요."
                });
            }
            const connection = await pool.getConnection(async (conn) => conn);
            const folderRows = await bookmarkDao.checkFolderExists(connection, folderId, userId);
            if(folderRows.length === 0){
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2038,
                    message: "존재하지 않는 folderId",
                })
            }

            await connection.beginTransaction();
            await bookmarkDao.deleteFolder(connection, folderId);
            await bookmarkDao.deleteFolderPosts(connection, folderId);
            await connection.commit();
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "폴더 삭제 성공",
            })
        } catch (err) {
            await connection.rollback();
            connection.release();
            logger.error(`App - deleteFolder DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - deleteFolder error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};

/**
* API No. 18
* API Name : 폴더 게사글 목록 조회 API
* [GET] /folders/:folderId/posts
*/
exports.getFolderPosts = async function (req, res) {
    try {
        try {
            const userId = req.verifiedToken.userId;
            const folderId = req.params.folderId;
            if(!folderId){
                return res.json({
                    isSuccess: false,
                    code: 2036,
                    message: "folderId를 입력해주세요."
                });
            }
            const connection = await pool.getConnection(async (conn) => conn);
            const folderRows = await bookmarkDao.checkFolderExists(connection, folderId, userId);
            if(folderRows.length === 0){
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 2038,
                    message: "존재하지 않는 folderId",
                });
            }

            const postRows = await bookmarkDao.getFolderPosts(connection, folderId);
            const result = {
                folderName : folderRows[0].folderName,
                post : postRows
            };
            connection.release();
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "폴더에 저장된 게시물 목록 조회 성공",
                result : result
            });
        } catch (err) {
            connection.release();
            logger.error(`App - getFolderPosts DB Connection error\n: ${JSON.stringify(err)}`);
            return res.json({isSuccess: false, code: 3002, message: "데이터베이스 연결에 실패하였습니다."});
        }
    } catch (err) {
        logger.error(`App - getFolderPosts error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};