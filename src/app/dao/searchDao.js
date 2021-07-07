const { pool } = require("../../../config/database");

// 검색어 목록 조회
async function getSearch(connection, userId, order) {
    let rows;
    if (order == 'recent') {
        const query = `
            SELECT keyword
            FROM SearchKeyword
            WHERE userId = ?
              and isDeleted = 'N'
            ORDER BY createdAt DESC LIMIT 10;
        `
        const params = [userId];
        rows = await connection.query(
            query,
            params
        );
    } else {
        const query = `
            SELECT keyword
            FROM SearchKeyword
            GROUP BY keyword
            ORDER BY count(*) DESC LIMIT 10;
        `
        rows = await connection.query(
            query
        );
    }
    return rows[0];
}

async function insertSearchKeyword(connection, userId, keyword) {

    await connection.beginTransaction()

    const selectQuery = `
        select searchId
        from SearchKeyword
        where userId = ?
          and keyword = ?;
    `
    const deleteQuery = `
        update SearchKeyword
        set isDeleted='Y'
        where userId = ?
          and keyword = ?;
    `
    const insertQuery = `
        insert into SearchKeyword (userId, keyword)
        values (?, ?);
    `

    const [rows] = await connection.query(
        selectQuery,
        [userId, keyword]
    );
    if (rows.length >= 1) {
        const [deleteRows] = await connection.query(
            deleteQuery,
            [userId, keyword]
        );
    }
    const [insertRows] = await connection.query(
        insertQuery,
        [userId, keyword]
    );

    await connection.commit();
    return insertRows;
}


module.exports = {
    getSearch,
    insertSearchKeyword,
};
