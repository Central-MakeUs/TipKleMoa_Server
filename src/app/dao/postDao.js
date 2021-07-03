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

// 미리보기 조회
async function getPreviews(connection, categoryId, order){
    let getPreviewsQuery;
    if(order=='recent'){
        getPreviewsQuery=`
            select postId,
               whenText as title,
               ifnull((select imgUrl from PostImage i where p.postId = i.postId order by imgId limit 1),'') as thumbnailUrl
            from Post p
            where categoryId=?
            order by createdAt desc
            limit 4;
        `
    }
    else if(order=='popular'){
        getPreviewsQuery=`
            select postId,
                   whenText as title,
                   ifnull((select imgUrl from PostImage i where p.postId = i.postId order by imgId limit 1),'') as thumbnailUrl
            from Post p
            where categoryId=?
            order by (select count(*)
                      from PostHits h
                      where h.postId = p.postId) desc,
                     (select avg(score) from PostStar s where s.postId = p.postId) desc,
                     (select count(*) from PostStar s where s.postId = p.postId) desc,
                     (select count(*) from Comment c where c.postId = p.postId) desc
            limit 4;
        `
    }
    else{
        return null;
    }

    const [Rows] = await connection.query(
        getPreviewsQuery,
        [categoryId]
    );
    return Rows;
}

module.exports = {
    getBanners,
    getPreviews,
};