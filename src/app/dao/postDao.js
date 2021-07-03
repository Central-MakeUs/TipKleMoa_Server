// 배너 목록 조회
async function getBanners(connection) {
    const getBannerQuery = `
        select postId,
               whenText as title,
               ifnull((select imgUrl from PostImage i where p.postId = i.postId order by imgId limit 1),'') as thumbnailUrl
        from Post p
        order by (select count(*)
                  from PostHits h
                  where h.postId = p.postId) desc,
                 (select avg(score) from PostStar s where s.postId = p.postId) desc,
                 (select count(*) from PostStar s where s.postId = p.postId) desc,
                 (select count(*) from Comment c where c.postId = p.postId) desc
            limit 4;
                `;
    const [Rows] = await connection.query(
        getBannerQuery
    );
    return Rows;
}

module.exports = {
    getBanners,
};