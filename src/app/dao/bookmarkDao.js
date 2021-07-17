const {pool} = require("../../../config/database");

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

async function addFolder(connection, userId, folderName) {
    const insertQuery = `
        insert into Folder(userId, FolderName)
        values (?, ?);
    `;
    await connection.query(
        insertQuery,
        [userId, folderName]
    );

    const selectQuery = `
        select LAST_INSERT_ID() as folderId;
    `;
    const [rows] = await connection.query(
        selectQuery
    )
    return rows[0];
}

async function checkFolderExists(connection, folderId, userId) {
    const query = `
        select *
        from Folder
        where folderId=? and userId=?;
    `;
    const [rows] = await connection.query(
        query,
        [folderId, userId]
    );
    return rows;
}

async function checkFolderPostExists(connection, userId, postId) {
    const query = `
        select FP.folderId as folderId, postId, userId
        from FolderPost FP
                 inner join (Select * from Folder where userId = ?) F on FP.folderId = F.folderId
        where postId = ?
    `;
    const [rows] = await connection.query(
        query,
        [userId, postId]
    );
    return rows;
}

async function addPostToFolder(connection, folderId, postId) {
    const query = `
        insert into FolderPost(folderId, postId)
        values (?, ?);
    `;
    const [rows] = await connection.query(
        query,
        [folderId, postId]
    );
    return rows;
}

async function getFolderState(connection, userId, postId) {
    const query = `
        select F.folderId,
               folderName,
               ifnull((select imgUrl
                       from PostImage
                       where FP.postId = PostImage.postId
                       order by imgId limit 1),'') as imgUrl,
               (case
                    when (select COUNT(*)
                          from FolderPost
                          where FolderPost.folderId = F.folderId
                            and FolderPost.postId = ?) > 0 then 'Y'
                    else 'N' end)                  as isBookMarked
        from Folder F
                 left outer join (select * from FolderPost group by folderId) FP on F.folderId = FP.folderId
        where userId = ?
        order by F.folderId;
    `;
    const [rows] = await connection.query(
        query,
        [postId, userId]
    );
    return rows;
}

async function deletePostFromFolder(connection, folderId, postId) {
    const query = `
        delete
        from FolderPost
        where folderId = ?
          and postId = ?;
    `;
    const [rows] = await connection.query(
        query,
        [folderId, postId]
    );
    return rows;
}

async function deleteFolder(connection, folderId){
    const query = `
        delete
        from Folder
        where folderId = ?;
    `;
    const [rows] = await connection.query(
        query,
        [folderId]
    );
    return rows;
}

module.exports = {
    getFolders,
    getFolderPosts,
    addFolder,
    checkFolderExists,
    checkFolderPostExists,
    addPostToFolder,
    getFolderState,
    deletePostFromFolder,
    deleteFolder,
};