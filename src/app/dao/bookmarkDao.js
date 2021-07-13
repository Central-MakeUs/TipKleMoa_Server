const { pool } = require("../../../config/database");

// 북마크 폴더 조회
async function getFolders(connection, userId) {
  const query = `
    SELECT folderId, folderName
    FROM Folder
    WHERE userId = ?;
  `;
  const params = [userId];
  const [rows] = await connection.query(
    query,
    params
  );
  return rows;
}

// 북마크 폴더별 대표 게시글 2개 조회
async function getFolderPosts(connection, folderId) {
  const query = `
    SELECT Post.postId, whenText AS title, (SELECT imgUrl FROM PostImage WHERE postId = Post.postId LIMIT 1) AS imgUrl
    FROM Post
    JOIN FolderPost
    ON folderId = ? and Post.postId = FolderPost.postId
    WHERE Post.isDeleted = 'N'
    LIMIT 2;
  `;
  const params = [folderId];
  const [rows] = await connection.query(
    query,
    params
  );
  return rows;
}


module.exports = {
  getFolders,
  getFolderPosts
};