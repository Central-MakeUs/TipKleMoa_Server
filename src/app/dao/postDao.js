// 배너 목록 조회
async function getBanners(connection) {
    const getBannerQuery = `
        select postId,
               whenText                            as title,
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
async function getPreviews(connection, categoryId, order) {
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
            where categoryId = ?
              and p.isDeleted = 'N'
            order by createdAt desc limit 4;
        `
    } else if (order == 'popular') {
        getPreviewsQuery = `
            select postId,
                   whenText                            as title,
                   ifnull((select imgUrl
                           from PostImage i
                           where p.postId = i.postId
                           order by imgId limit 1),'') as thumbnailUrl
            from Post p
            where categoryId = ?
              and p.isDeleted = 'N'
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
        [categoryId]
    );
    return Rows;
}

async function getPosts(connection, categoryId, order) {
    let getPostsQuery;
    if (order == 'recent') {
        getPostsQuery = `
            select postId,
                   userId,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                       as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when LENGTH(description) <= 20 then description
                        else concat(substr(description, 1, 20), '...더보기') end) as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                 as score,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            0)                                                 as star,
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
                       )                                                       as createdAt
            from Post
            where categoryId = ?
              and Post.isDeleted = 'N'
            order by Post.createdAt desc;
        `
    } else if (order == 'popular') {
        getPostsQuery = `
            select postId,
                   userId,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                       as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when LENGTH(description) <= 20 then description
                        else concat(substr(description, 1, 20), '...더보기') end) as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                 as score,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            0)                                                 as star,
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
                       )                                                       as createdAt
            from Post
            where categoryId = ?
              and Post.isDeleted = 'N'
            order by (select count(*)
                      from PostHits h
                      where h.postId = Post.postId) desc,
                     (select avg(score) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from PostStar s where s.postId = Post.postId) desc,
                     (select count(*) from Comment c where c.postId = Post.postId) desc;
        `
    }

    const [Rows] = await connection.query(
        getPostsQuery,
        [categoryId]
    );
    return Rows;
}

async function searchPosts(connection, search, order) {
    let searchQuery;
    if (order == 'recent') {
        searchQuery = `
            select postId,
                   userId,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                       as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when LENGTH(description) <= 20 then description
                        else concat(substr(description, 1, 20), '...더보기') end) as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                 as score,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            0)                                                 as star,
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
                       )                                                       as createdAt
            from Post
            where Post.isDeleted = 'N'
              and (PostId in (select postId
                              from PostImage
                              where (imgText like concat('%', ?, '%')))
                or (whenText like concat('%', ?, '%'))
                or (howText like concat('%', ?, '%')))
            order by Post.createdAt desc;
        `
    } else if (order == 'popular') {
        searchQuery = `
            select postId,
                   userId,
                   (select levelImgUrl
                    from UserInfo
                             inner join Level on UserInfo.level = Level.level
                    where UserInfo.userId = Post.userId)                       as profileImgUrl,
                   whenText,
                   howText,
                   (case
                        when LENGTH(description) <= 20 then description
                        else concat(substr(description, 1, 20), '...더보기') end) as description,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            1)                                                 as score,
                   truncate(ifnull((select avg(score) from PostStar where PostStar.postId = Post.postId), 0),
                            0)                                                 as star,
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
                       )                                                       as createdAt
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
                     (select count(*) from Comment c where c.postId = Post.postId) desc;
        `
    }

    const [Rows] = await connection.query(
        searchQuery,
        [search, search, search]
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

module.exports = {
    getBanners,
    getPreviews,
    getPosts,
    searchPosts,
    getPostImages,
};