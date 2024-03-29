// 배너 목록 조회
async function getBanners(connection, userId) {
    const getBannerQuery = `
        select postId,
               concat('[', (select categoryName from Category where categoryId = p.categoryId), '] ', whenText) as title,
               ifnull((select imgUrl
                       from PostImage i
                       where p.postId = i.postId
                       order by imgId limit 1),'') as thumbnailUrl
        from Post p
        where p.isDeleted = 'N' and postId not in (select postId from ReportedPost where userId=?)
        order by (select count(*)
                  from PostHits h
                  where h.postId = p.postId) desc,
                 (select avg(score) from PostStar s where s.postId = p.postId) desc,
                 (select count(*) from PostStar s where s.postId = p.postId) desc,
                 (select count(*) from Comment c where c.postId = p.postId) desc limit 4;
    `;
    const [Rows] = await connection.query(
        getBannerQuery,
        [userId]
    );
    return Rows;
}

// 미리보기 조회
async function getPreviews(connection, categoryName, order, userId) {
    let getPreviewsQuery;
    if (order == 'recent') {
        getPreviewsQuery = `
            select postId,
                   whenText                            as title,
                   ifnull((select imgUrl
                           from PostImage i
                           where p.postId = i.postId
                           order by imgId limit 1),'') as thumbnailUrl
            from Post p
            where p.isDeleted='N' and categoryId = (select categoryId from Category where categoryName = ?)
              and postId not in (select postId from ReportedPost where userId=?)
            order by createdAt desc limit 4;
        `
    } else if (order == 'popular') {
        getPreviewsQuery = `
            select postId,
                   whenText                            as title,
                   ifnull((select imgUrl
                           from PostImage i
                           where p.postId = i.postId
                           order by imgId limit 1), '') as thumbnailUrl
            from Post p
            where p.isDeleted='N' and categoryId = (select categoryId from Category where categoryName = ?)
              and postId not in (select postId from ReportedPost where userId=?)
            order by (select count(*)
                      from PostHits h
                      where h.postId = p.postId) desc,
                     (select avg(score) from PostStar s where s.postId = p.postId) desc,
                     (select count(*) from PostStar s where s.postId = p.postId) desc,
                     (select count(*) from Comment c where c.postId = p.postId) desc limit 4;
        `
    } else {
        return null;
    }

    const [Rows] = await connection.query(
        getPreviewsQuery,
        [categoryName, userId]
    );
    return Rows;
}

// 게시물 목록 조회
async function getPosts(connection, categoryName, userId, order, page, limit) {
    let getPostsQuery;
    if (order == 'recent') {
        getPostsQuery = `
            select postId,
                   Post.userId,
                   nickName,
                   ifnull(profileImg, (select levelImgUrl
                                       from Level
                                       where UI.level = Level.level))          as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when isnull(description) then ''
                        when CHAR_LENGTH(description) <= 70 then description
                        else concat(substr(description, 1, 70), '...더보기') end) as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                 as score,
                   cast((truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                                  0)) as unsigned)                             as star,
                   (case
                        when timestampdiff(hour, Post.createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, Post.createdAt, now()) <= 12
                            then concat(timestampdiff(hour, Post.createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, Post.createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, Post.createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, Post.createdAt, now()) <= 30
                            then concat(timestampdiff(day, Post.createdAt, now()), '일 전')
                        when timestampdiff(month, Post.createdAt, now()) < 12
                            then concat(timestampdiff(month, Post.createdAt, now()), '달 전')
                        when timestampdiff(month, Post.createdAt, now()) > 12
                            then concat(timestampdiff(year, Post.createdAt, now()), '년 전')
                       end
                       )                                                       as createdAt
            from Post
                     inner join UserInfo UI on Post.userId = UI.userId
            where categoryId = (select categoryId from Category where categoryName = ?)
              and Post.isDeleted = 'N'
              and postId not in (select postId from ReportedPost RP where RP.userId = ?)
            order by Post.createdAt desc, Post.postId desc
                limit ?, ?;
        `
    } else if (order == 'popular') {
        getPostsQuery = `
            select postId,
                   Post.userId,
                   nickName,
                   ifnull(profileImg, (select levelImgUrl
                                       from Level
                                       where UI.level = Level.level))          as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when isnull(description) then ''
                        when CHAR_LENGTH(description) <= 70 then description
                        else concat(substr(description, 1, 70), '...더보기') end) as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                 as score,
                   cast((truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                                  0)) as unsigned)                             as star,
                   (case
                        when timestampdiff(hour, Post.createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, Post.createdAt, now()) <= 12
                            then concat(timestampdiff(hour, Post.createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, Post.createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, Post.createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, Post.createdAt, now()) <= 30
                            then concat(timestampdiff(day, Post.createdAt, now()), '일 전')
                        when timestampdiff(month, Post.createdAt, now()) < 12
                            then concat(timestampdiff(month, Post.createdAt, now()), '달 전')
                        when timestampdiff(month, Post.createdAt, now()) > 12
                            then concat(timestampdiff(year, Post.createdAt, now()), '년 전')
                       end
                       )                                                       as createdAt
            from Post
                     inner join UserInfo UI on Post.userId = UI.userId
            where categoryId = (select categoryId from Category where categoryName = ?)
              and Post.isDeleted = 'N'
              and postId not in (select postId from ReportedPost RP where RP.userId = ?)
            order by (select count(*)
                      from PostHits h
                      where h.postId = Post.postId) desc,
                     (select avg(score) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from Comment c where c.postId = Post.postId) desc,
                     Post.createdAt desc, Post.postId desc
                limit ?, ?;
        `
    }

    const [Rows] = await connection.query(
        getPostsQuery,
        [categoryName, userId, page, limit]
    );
    return Rows;
}

// 게시물 검색
async function searchPosts(connection, search, userId, order, page, limit) {
    let searchQuery;
    if (order == 'recent') {
        searchQuery = `
            select postId,
                   Post.userId,
                   nickName,
                   ifnull(profileImg, (select levelImgUrl
                                       from Level
                                       where UI.level = Level.level))          as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when isnull(description) then ''
                        when CHAR_LENGTH(description) <= 70 then description
                        else concat(substr(description, 1, 70), '...더보기') end)         as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                         as score,
                   cast((truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                                  0)) as unsigned)                                     as star,
                   (case
                        when timestampdiff(hour, Post.createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, Post.createdAt, now()) <= 12
                            then concat(timestampdiff(hour, Post.createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, Post.createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, Post.createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, Post.createdAt, now()) <= 30
                            then concat(timestampdiff(day, Post.createdAt, now()), '일 전')
                        when timestampdiff(month, Post.createdAt, now()) < 12
                            then concat(timestampdiff(month, Post.createdAt, now()), '달 전')
                        when timestampdiff(month, Post.createdAt, now()) > 12
                            then concat(timestampdiff(year, Post.createdAt, now()), '년 전')
                       end
                       )                                                               as createdAt
            from Post inner join UserInfo UI on Post.userId = UI.userId
            where Post.isDeleted = 'N' and postId not in (select postId from ReportedPost where userId=?)
              and (PostId in (select postId
                              from PostImage
                              where (imgText like concat('%', ?, '%')))
                or (whenText like concat('%', ?, '%'))
                or (howText like concat('%', ?, '%')))
            order by Post.createdAt desc, postId desc limit ?, ?;
            `
    } else if (order == 'popular') {
        searchQuery = `
            select postId,
                   Post.userId,
                   nickName,
                   ifnull(profileImg, (select levelImgUrl
                                       from Level
                                       where UI.level = Level.level))          as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when isnull(description) then ''
                        when CHAR_LENGTH(description) <= 70 then description
                        else concat(substr(description, 1, 70), '...더보기') end)         as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                         as score,
                   cast((truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                                  0)) as unsigned)                                     as star,
                   (case
                        when timestampdiff(hour, Post.createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, Post.createdAt, now()) <= 12
                            then concat(timestampdiff(hour, Post.createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, Post.createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, Post.createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, Post.createdAt, now()) <= 30
                            then concat(timestampdiff(day, Post.createdAt, now()), '일 전')
                        when timestampdiff(month, Post.createdAt, now()) < 12
                            then concat(timestampdiff(month, Post.createdAt, now()), '달 전')
                        when timestampdiff(month, Post.createdAt, now()) > 12
                            then concat(timestampdiff(year, Post.createdAt, now()), '년 전')
                       end
                       )                                                               as createdAt
            from Post inner join UserInfo UI on Post.userId = UI.userId
            where Post.isDeleted = 'N' and postId not in (select postId from ReportedPost RP where RP.userId=?)
              and (PostId in (select postId
                              from PostImage
                              where (imgText like concat('%', ?, '%')))
                or (whenText like concat('%', ?, '%'))
                or (howText like concat('%', ?, '%')))
            order by (select count(*)
                      from PostHits h
                      where h.postId = Post.postId) desc,
                     (select avg(score) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from Comment c where c.postId = Post.postId) desc,
                     createdAt desc, postId desc limit ?, ?;
        `
    }

    const [Rows] = await connection.query(
        searchQuery,
        [userId, search, search, search, page, limit]
    );
    return Rows;
}

async function getPostImages(connection, postId) {
    const getImageQuery = `
        select imgUrl
        from PostImage
        where postId = ?
        order by imgId;
    `;
    const [Rows] = await connection.query(
        getImageQuery,
        [postId]
    );
    return Rows;
}

// 게시물 상세 조회
async function getPostDetail(connection, postId, userId) {
    const getPostDeatilQuery = `
        select postId,
               Post.userId,
               nickName,
               ifnull(profileImg, (select levelImgUrl
                                   from Level
                                   where UI.level = Level.level) ) as profileImgUrl,
               whenText,
               howText,
               ifnull(description, '')                                             as description,
               truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                        1)                                                         as score,
               cast((truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                              0)) as unsigned)                                     as star,
               (select if(EXISTS(select * from PostStar where Post.postId = PostStar.postId and PostStar.userId = ?), 'Y',
                          'N'))                                                    as isStarred,
               (select if(EXISTS(select *
                                 from FolderPost FP
                                          inner join Folder F on F.folderId = FP.folderId
                                 where userId = ?
                                   and postId = Post.postId), 'Y',
                          'N'))                                                    as isBookMarked,
               (select COUNT(*) from Comment where Comment.postId = Post.postId and Comment.isDeleted='N'
                                               and commentId not in (select commentId from ReportedComment RC where RC.userId = ?)) as commentCount
        from Post inner join UserInfo UI on Post.userId = UI.userId
        where postId = ?;
    `;
    const [Rows] = await connection.query(
        getPostDeatilQuery,
        [userId, userId, userId, postId]
    );
    return Rows;
}

async function addPostHits(connection, userId, postId) {
    const checkQuery = `
        select *
        from PostHits
        where userId = ?
          and postId = ?;
    `
    const [Rows] = await connection.query(
        checkQuery,
        [userId, postId]
    );

    if (Rows.length == 0) {
        const addQuery = `
            insert into PostHits (userId, postId)
            values (?, ?);
        `
        await connection.query(
            addQuery,
            [userId, postId]
        );
    }

    return Rows;
}

async function checkPostExists(connection, postId) {
    const query = `
        select *
        from Post
        where postId = ? and Post.isDeleted='N';
    `
    const [rows] = await connection.query(
        query,
        [postId]
    );
    return rows;
}

// 게시글 등록
async function insertPost(connection, userId, category, whenText, howText, description) {
  const categoryQuery = `
      SELECT categoryId
      FROM Category
      WHERE categoryName = ?
  `;
  const categoryParams = [category];
  const [categoryRows] = await connection.query(
    categoryQuery,
    categoryParams
  );

  const query = `
      INSERT INTO Post(categoryId, userId, whenText, howText, description)
      VALUES (?, ?, ?, ?, ?);
  `;
  const params = [categoryRows[0].categoryId, userId, whenText, howText, description];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 이미지 URL 등록
async function insertImgUrl(connection, postId, imgUrl) {
  const query = `
      INSERT INTO PostImage(postId, imgUrl)
      VALUES (?, ?);
  `;
  const params = [postId, imgUrl];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 게시글 신고
async function insertReport(connection, userId, postId, reason) {
  const query = `
      INSERT INTO ReportedPost(userId, postId, reason)
      VALUES (?, ?, ?);
  `;
  const params = [userId, postId, reason];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 댓글 신고
async function reportComment(connection, userId, commentId, reason) {
    const query = `
      INSERT INTO ReportedComment(userId, commentId, reason)
      VALUES (?, ?, ?);
  `;
    const params = [userId, commentId, reason];
    const rows = await connection.query(
        query,
        params
    );
    return rows[0];
}

async function checkPostAuthor(connection, postId, userId) {
    const query = `
        select *
        from Post
        where postId = ?
          and userId = ?;
    `;
    const [rows] = await connection.query(
        query,
        [postId, userId]
    );
    return rows;
}

async function deletePosts(connection, postId) {
    const query = `
        update Post
        set isDeleted='Y'
        where postId = ?;
    `;
    const [rows] = await connection.query(
        query,
        [postId]
    );
    return rows;
}

// 별점 존재 여부 확인
async function checkStarExists(connection, userId, postId) {
    const query = `
        select *
        from PostStar
        where userId = ? and postId = ?;
    `
    const [rows] = await connection.query(
        query,
        [userId, postId]
    );
    return rows;
}

// 별점 등록
async function insertStar(connection, userId, postId, star) {
  const query = `
      INSERT INTO PostStar(userId, postId, score)
      VALUES (?, ?, ?);
  `;
  const params = [userId, postId, star];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 별점 수정
async function updateStar(connection, userId, postId, star) {
  const query = `
      UPDATE PostStar
      SET score = ?
      WHERE userId = ? and postId = ?
  `;
  const params = [star, userId, postId];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 댓글 등록
async function insertComment(connection, userId, postId, content) {
  const query = `
      INSERT INTO Comment(postId, userId, content)
      VALUES (?, ?, ?);
  `;
  const params = [postId, userId, content];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 댓글 조회
async function getComments(connection, userId, postId) {
    const query = `
        SELECT commentId,
               Comment.userId,
               nickName,
               ifnull(profileImg, (select levelImgUrl
                                   from Level
                                   where UI.level = Level.level) ) as profileImgUrl,
            content,
            (CASE
                WHEN timestampdiff(hour, Comment.createdAt, now()) <= 1 THEN '방금'
                WHEN timestampdiff(hour, Comment.createdAt, now()) <= 12
                    THEN concat(timestampdiff(hour, Comment.createdAt, now()) <= 12, '시간 전')
                WHEN timestampdiff(hour, Comment.createdAt, now()) <= 24 THEN '오늘'
                WHEN timestampdiff(day, Comment.createdAt, now()) = 1 THEN '어제'
                WHEN timestampdiff(day, Comment.createdAt, now()) <= 30
                    THEN concat(timestampdiff(day, Comment.createdAt, now()), '일 전')
                WHEN timestampdiff(month, Comment.createdAt, now()) < 12
                    THEN concat(timestampdiff(month, Comment.createdAt, now()), '달 전')
                WHEN timestampdiff(month, Comment.createdAt, now()) > 12
                    THEN concat(timestampdiff(year, Comment.createdAt, now()), '년 전')
               END
               ) AS createdAt,
           (CASE
                WHEN Comment.userId = ? THEN 'Y'
                ELSE 'N'
           END
           ) AS isAuthor
        FROM Comment inner join UserInfo UI on Comment.userId = UI.userId
        WHERE postId = ? and Comment.isDeleted='N' and commentId not in (select commentId from ReportedComment where userId=?)
        ORDER BY Comment.createdAt
    `
    const params = [userId, postId, userId];
    const [rows] = await connection.query(
        query,
        params
    );

    return rows;
}

async function getCommentDetail(connection, commentId) {
    const query = `
        select *
        from Comment
        where commentId=?
    `
    const [rows] = await connection.query(
        query,
        [commentId]
    );
    return rows;
}

// 댓글 삭제 권한 확인
async function checkCommentExists(connection, userId, commentId) {
    const query = `
        select *
        from Comment
        where userId=? and commentId=? and isDeleted='N'
    `
    const [rows] = await connection.query(
        query,
        [userId, commentId]
    );
    return rows;
}

// 댓글 삭제
async function deleteComment(connection, commentId) {
    const query = `
        UPDATE Comment
        SET isDeleted='Y'
        WHERE commentId=?;
    `
    const [rows] = await connection.query(
        query,
        [commentId]
    );
    return rows;
}

// 댓글 존재 여부 확인
async function checkCommentValid(connection, commentId) {
    const query = `
        select *
        from Comment
        where commentId=? and isDeleted='N'
    `
    const [rows] = await connection.query(
        query,
        [commentId]
    );
    return rows;
}

module.exports = {
    getBanners,
    getPreviews,
    getPosts,
    searchPosts,
    getPostImages,
    checkPostExists,
    getPostDetail,
    addPostHits,
    insertPost,
    insertImgUrl,
    insertReport,
    reportComment,
    checkPostAuthor,
    deletePosts,
    checkStarExists,
    insertStar,
    updateStar,
    insertComment,
    getComments,
    getCommentDetail,
    checkCommentExists,
    deleteComment,
    checkCommentValid,
};