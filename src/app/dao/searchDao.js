const { pool } = require("../../../config/database");

// 검색어 목록 조회
async function getSearch(connection, userId, order) {
  let rows;
  if(order == 'recent') {
      const query = `
        SELECT keyword
        FROM SearchKeyword
        WHERE userId = ? and isDeleted = 'N'
        ORDER BY createdAt DESC
        LIMIT 10;
      `
      const params = [userId];
      rows = await connection.query(
        query,
        params
      );
  }
  else {
      const query = `
        SELECT keyword
        FROM SearchKeyword
        GROUP BY keyword
        ORDER BY count(*) DESC
        LIMIT 10;
      `
      rows = await connection.query(
        query
      );
  }
  return rows[0];
}


module.exports = {
  getSearch
};
