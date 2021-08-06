// 포인트 적용
async function insertPoint(connection, userId, point, reason) {
    const pointQuery = `
        INSERT INTO Point(userId, point, reason)
        VALUES (?, ?, ?);
    `;
    const pointParams = [userId, point, reason];
    const pointRows = await connection.query(
        pointQuery,
        pointParams
    );

    const userPointQuery = `
        UPDATE UserInfo
        SET point = CASE
                        WHEN (point + ?) >= 0 THEN point + ?
                        ELSE 0
            END
        WHERE userId = ?
    `;
    const userPointParams = [point, point, userId];
    const userPointRows = await connection.query(
        userPointQuery,
        userPointParams
    );

    const userLevelQuery = `
        UPDATE UserInfo
        SET level = CASE
                        WHEN point >= 500 THEN 3
                        WHEN point >= 100 THEN 2
                        ELSE 1
            END
        WHERE userId = ?
    `;
    const userLevelParams = [userId];
    const userLevelRows = await connection.query(
        userLevelQuery,
        userLevelParams
    );

    return [pointRows[0], userPointRows[0], userLevelRows[0]];
}


module.exports = {
    insertPoint
};