const { pool } = require("../../../config/database");

// 카테고리 목록 조회
async function getCategories(connection) {
  const query = `
    SELECT *
    FROM Category;
  `;
  const [rows] = await connection.query(
    query
  );
  return rows;
}

// 사용자 관심 카테고리 목록 조회
async function getUserCategories(connection, userId) {
  const query = `
    SELECT UserCategory.categoryId, categoryName
    FROM UserCategory
    JOIN Category
    ON UserCategory.categoryId = Category.categoryId
    WHERE userId = ?;
  `;
  const params = [userId];
  const [rows] = await connection.query(
    query,
    params
  );
  return rows;
}

// 사용자 관심 카테고리 목록 삭제
async function deleteUserCategory(connection, userId) {
  const query = `
      DELETE FROM UserCategory
      WHERE userId = ?
  `;
  const params = [userId];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 사용자 관심 카테고리 목록 추가
async function insertUserCategory(connection, userId, category) {
  const query = `
      INSERT INTO UserCategory(userId, categoryId)
      VALUES (?, ?);
  `;
  const params = [userId, category];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}


module.exports = {
  getCategories,
  getUserCategories,
  deleteUserCategory,
  insertUserCategory
};
