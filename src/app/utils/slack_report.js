const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const userDao = require('../dao/userDao');
const postDao = require('../dao/postDao');

const {WebClient, LogLevel} = require("@slack/web-api");
const secret_config = require('../../../config/secret');

const API_TOKEN = secret_config.slack_token;
const client = new WebClient(API_TOKEN, {
    logLevel: LogLevel.ERROR
});

// 슬랙 채널로 신고 정보 전송
exports.send_report = async function (kind, userId, postId, reason) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const userRows = await userDao.getProfile(connection, userId);
        let text;

        if (kind === "post") {
            const postRows = await postDao.getPostDetail(connection, postId, userId);
            const imgRows = await postDao.getPostImages(connection, postId)
            text = "🚨 게시물 신고 🚨\n\n" + userRows[0].nickName + "님이 게시글을 신고했습니다.\n\n신고 사유 : " + reason +
                "\n=========== 게시글 정보 ===========\n" + "postId : " + postId + "\n" + "content : " +
                postRows[0].whenText + "\n" + "img : " + imgRows[0].imgUrl
        } else {
            const commentRows = await postDao.getCommentDetail(connection, postId);
            text = "🚨 댓글 신고 🚨\n\n" + userRows[0].nickName + "님이 댓글을 신고했습니다.\n\n신고 사유 : " + reason +
                "\n=========== 댓글 정보 ===========\n" + "commentId : " + postId + "\n" + "content : " + commentRows[0].content
        }

        try {
            await client.chat.postMessage({
                "channel": "report",
                "text": text
            });
        } catch (error) {
            connection.release();
            console.log(error);
        }
        connection.release();
    } catch (err) {
        logger.error(`App - insertReport error\n: ${JSON.stringify(err)}`);
        return res.json({isSuccess: false, code: 3001, message: "서버와의 통신에 실패하였습니다."});
    }
};