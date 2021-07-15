const { pool } = require("../../../config/database");

// 카카오 로그인 회원 여부 체크
async function getUserByKakao(connection, kakaoId) {
  const query = `
    SELECT userId
    FROM UserInfo
    WHERE kakaoId = ? AND isDeleted='N';
  `;
  const params = [kakaoId];
  const [rows] = await connection.query(
    query,
    params
  );
  return rows;
}

// 카카오 회원가입
async function insertUserInfoByKakao(connection, kakaoId, nickName) {
  const query = `
      INSERT INTO UserInfo(kakaoId, nickName)
      VALUES (?, ?);
  `;
  const params = [kakaoId, nickName];
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

// 마이페이지 조회
async function getProfile(connection, userId) {
  const query = `
    SELECT Level.level, levelName, levelImgUrl, nickName, point
    FROM UserInfo
    JOIN Level
    ON UserInfo.level = Level.level
    WHERE userId = ?;
  `;
  const params = [userId];
  const [rows] = await connection.query(
    query,
    params
  );
  return rows;
}

// 닉네임 수정
async function updateNickname(connection, userId, nickName) {
  const query = `
    UPDATE UserInfo
    SET nickName = ?
    WHERE userId = ?
  `;
  const params = [nickName, userId];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 로그아웃
async function logout(connection, userId) {
  const query = `
    UPDATE UserInfo
    SET loginStatus = 'N'
    WHERE userId = ?
  `;
  const params = [userId];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}

// 회원탈퇴
async function deleteUser(connection, userId) {
  const query = `
    UPDATE UserInfo
    SET isDeleted = 'Y'
    WHERE userId = ?
  `;
  const params = [userId];
  const rows = await connection.query(
    query,
    params
  );
  return rows[0];
}


module.exports = {
  getUserByKakao,
  insertUserInfoByKakao,
  insertUserCategory,
  getProfile,
  updateNickname,
  logout,
  deleteUser
};
