// 배너 목록 조회
async function getBanners(connection) {
    const getBannerQuery = `
        select postId,
               concat('[', (select categoryName from Category where categoryId = p.categoryId), '] ', whenText) as title,
               ifnull((select imgUrl
                       from PostImage i
                       where p.postId = i.postId
                       order by imgId limit 1),'') as thumbnailUrl
        from Post p
        where p.isDeleted = 'N'
        order by (select count(*)
                  from PostHits h
                  where h.postId = p.postId) desc,
                 (select avg(score) from PostStar s where s.postId = p.postId) desc,
                 (select count(*) from PostStar s where s.postId = p.postId) desc,
                 (select count(*) from Comment c where c.postId = p.postId) desc limit 4;
    `;
    const [Rows] = await connection.query(
        getBannerQuery
    );
    return Rows;
}

// 미리보기 조회
async function getPreviews(connection, categoryName, order) {
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
        [categoryName]
    );
    return Rows;
}

async function getPosts(connection, categoryName, order, page, limit) {
    let getPostsQuery;
    if (order == 'recent') {
        getPostsQuery = `
            select postId,
                   userId,
                   (select nickName from UserInfo where UserInfo.userId = Post.userId) as nickName,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                               as profileImgUrl,
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
                        when timestampdiff(hour, createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, createdAt, now()) <= 12
                            then concat(timestampdiff(hour, createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, createdAt, now()) <= 30
                            then concat(timestampdiff(day, createdAt, now()), '일 전')
                        when timestampdiff(month, createdAt, now()) < 12
                            then concat(timestampdiff(month, createdAt, now()), '달 전')
                        when timestampdiff(month, createdAt, now()) > 12
                            then concat(timestampdiff(year, createdAt, now()), '년 전')
                       end
                       )                                                               as createdAt
            from Post
            where categoryId = (select categoryId from Category where categoryName=?)
              and Post.isDeleted = 'N'
            order by Post.createdAt desc, Post.postId desc limit ?, ?;
        `
    } else if (order == 'popular') {
        getPostsQuery = `
            select postId,
                   userId,
                   (select nickName from UserInfo where UserInfo.userId = Post.userId) as nickName,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                               as profileImgUrl,
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
                        when timestampdiff(hour, createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, createdAt, now()) <= 12
                            then concat(timestampdiff(hour, createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, createdAt, now()) <= 30
                            then concat(timestampdiff(day, createdAt, now()), '일 전')
                        when timestampdiff(month, createdAt, now()) < 12
                            then concat(timestampdiff(month, createdAt, now()), '달 전')
                        when timestampdiff(month, createdAt, now()) > 12
                            then concat(timestampdiff(year, createdAt, now()), '년 전')
                       end
                       )                                                               as createdAt
            from Post
            where categoryId = (select categoryId from Category where categoryName=?)
              and Post.isDeleted = 'N'
            order by (select count(*)
                      from PostHits h
                      where h.postId = Post.postId) desc,
                     (select avg(score) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from Comment c where c.postId = Post.postId) desc,
                     Post.createdAt desc, Post.postId desc limit ?, ?;
        `
    }

    const [Rows] = await connection.query(
        getPostsQuery,
        [categoryName, page, limit]
    );
    return Rows;
}

async function searchPosts(connection, search, order, page, limit) {
    let searchQuery;
    if (order == 'recent') {
        searchQuery = `
            select postId,
                   userId,
                   (select nickName from UserInfo where UserInfo.userId = Post.userId) as nickName,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                               as profileImgUrl,
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
                        when timestampdiff(hour, createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, createdAt, now()) <= 12
                            then concat(timestampdiff(hour, createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, createdAt, now()) <= 30
                            then concat(timestampdiff(day, createdAt, now()), '일 전')
                        when timestampdiff(month, createdAt, now()) < 12
                            then concat(timestampdiff(month, createdAt, now()), '달 전')
                        when timestampdiff(month, createdAt, now()) > 12
                            then concat(timestampdiff(year, createdAt, now()), '년 전')
                       end
                       )                                                               as createdAt
            from Post
            where Post.isDeleted = 'N'
              and (PostId in (select postId
                              from PostImage
                              where (imgText like concat('%', ?, '%')))
                or (whenText like concat('%', ?, '%'))
                or (howText like concat('%', ?, '%')))
            order by Post.createdAt desc, postId desc limit ?, ?;`
    } else if (order == 'popular') {
        searchQuery = `
            select postId,
                   userId,
                   (select nickName from UserInfo where UserInfo.userId = Post.userId) as nickName,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                               as profileImgUrl,
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
                        when timestampdiff(hour, createdAt, now()) <= 1 then '방금'
                        when timestampdiff(hour, createdAt, now()) <= 12
                            then concat(timestampdiff(hour, createdAt, now()) <= 12, '시간 전')
                        when timestampdiff(hour, createdAt, now()) <= 24 then '오늘'
                        when timestampdiff(day, createdAt, now()) = 1 then '어제'
                        when timestampdiff(day, createdAt, now()) <= 30
                            then concat(timestampdiff(day, createdAt, now()), '일 전')
                        when timestampdiff(month, createdAt, now()) < 12
                            then concat(timestampdiff(month, createdAt, now()), '달 전')
                        when timestampdiff(month, createdAt, now()) > 12
                            then concat(timestampdiff(year, createdAt, now()), '년 전')
                       end
                       )                                                               as createdAt
            from Post
            where Post.isDeleted = 'N'
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
        [search, search, search, page, limit]
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

async function getPostDetail(connection, postId, userId) {
    const getPostDeatilQuery = `
        select postId,
               userId,
               (select nickName from UserInfo where UserInfo.userId = Post.userId) as nickName,
               (select levelImgUrl
                from UserInfo
                         inner join Level on UserInfo.level = Level.level
                where UserInfo.userId = Post.userId)                               as profileImgUrl,
               whenText,
               howText,
               ifnull(description, '')                                             as description,
               truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                        1)                                                         as score,
               cast((truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                              0)) as unsigned)                                     as star,
               (select if(EXISTS(select * from PostStar where Post.postId = PostStar.postId and Post.userId = ?), 'Y',
                          'N'))                                                    as isStarred,
               (select if(EXISTS(select *
                                 from FolderPost FP
                                          inner join Folder F on F.folderId = FP.folderId
                                 where userId = ?
                                   and postId = Post.postId), 'Y',
                          'N'))                                                    as isBookMarked,
               (select COUNT(*) from Comment where Comment.postId = Post.postId)   as commentCount
        from Post
        where postId = ?;
    `;
    const [Rows] = await connection.query(
        getPostDeatilQuery,
        [userId, userId, postId]
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
    checkPostAuthor,
    deletePosts,
};