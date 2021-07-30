const { pool } = require("../../../config/database");

// 사용자 키워드 존재 여부 확인
async function checkUserKeywordExists(connection, userId, keyword) {
    const query = `
        select *
        from SubscribeKeyword
        where userId = ? and keyword = ?;
    `
    const [rows] = await connection.query(
        query,
        [userId, keyword]
    );
    return rows;
}

// 키워드 등록
async function insertKeyword(connection, userId, keyword) {
  const query = `
      INSERT INTO SubscribeKeyword(userId, keyword)
      VALUES (?, ?);
  `;
  const params = [userId, keyword];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 키워드 목록 조회
async function getKeywords(connection, userId) {
  const query = `
    SELECT keywordId, keyword
    FROM SubscribeKeyword
    WHERE userId = ?;
  `;
  const params = [userId];
  const [rows] = await connection.query(
    query,
    params
  );
  return rows;
}

// 키워드 존재 여부 확인
async function checkKeywordExists(connection, userId, keywordId) {
    const query = `
        select *
        from SubscribeKeyword
        where userId = ? and keywordId = ?;
    `
    const [rows] = await connection.query(
        query,
        [userId, keywordId]
    );
    return rows;
}

// 키워드 삭제
async function deleteKeyword(connection, keywordId) {
  const query = `
      DELETE FROM SubscribeKeyword
      WHERE keywordId = ?
  `;
  const params = [keywordId];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}


module.exports = {
  checkUserKeywordExists,
  insertKeyword,
  getKeywords,
  checkKeywordExists,
  deleteKeyword
};
