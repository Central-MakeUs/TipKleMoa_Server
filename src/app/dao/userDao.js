// 카카오 로그인 회원 여부 체크
async function getUserByKakao(connection, kakaoId) {
    const query = `
        SELECT userId
        FROM UserInfo
        WHERE kakaoId = ?
          AND isDeleted = 'N';
    `;
    const params = [kakaoId];
    const [rows] = await connection.query(
        query,
        params
    );
    return rows;
}

// fcm 토큰 및 로그인 여부 갱신
async function updateUserInfoByfcm(connection, userId, fcmToken) {
    const query = `
        UPDATE UserInfo
        SET deviceToken = ?,
            loginStatus = 'Y'
        WHERE userId = ?
    `;
    const params = [fcmToken, userId];
    const rows = await connection.query(
        query,
        params
    );
    return rows[0];
}

// 카카오 회원가입
async function insertUserInfoByKakao(connection, kakaoId, nickName, fcmToken) {
    const query = `
        INSERT INTO UserInfo(kakaoId, nickName, deviceToken)
        VALUES (?, ?, ?);
    `;
    const params = [kakaoId, nickName, fcmToken];
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
        SELECT Level.level, levelName, ifnull(profileImg, profileImgUrl) as profileImgUrl, nickName, point
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

// 프로필 사진 수정
async function updateProfileImg(connection, userId, imgUrl) {
    const query = `
        UPDATE UserInfo
        SET profileImg = ?
        WHERE userId = ?
    `;
    const params = [imgUrl, userId];
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

// JWT 토큰 블랙리스트에 추가
async function insertBlacklist(connection, token) {
    const query = `
        INSERT INTO Blacklist(jwt)
        VALUES (?);
    `;
    const params = [token];
    const rows = await connection.query(
        query,
        params
    );
    return rows[0];
}

// JWT 토큰 블랙리스트에 있는지 확인
async function checkBlacklist(connection, token) {
    const query = `
        SELECT jwt
        FROM Blacklist
        WHERE jwt = ?
    `;
    const params = [token];
    const [rows] = await connection.query(
        query,
        params
    );
    return rows;
}

// 기한이 지난 블랙리스트 삭제
async function deleteBlacklist(connection) {
    const query = `
        DELETE
        FROM Blacklist
        WHERE createdAt < Now() - INTERVAL 1 YEAR
    `;
    const [rows] = await connection.query(
        query
    );
    return rows;
}


module.exports = {
    getUserByKakao,
    updateUserInfoByfcm,
    insertUserInfoByKakao,
    insertUserCategory,
    getProfile,
    updateNickname,
    logout,
    deleteUser,
    insertBlacklist,
    checkBlacklist,
    deleteBlacklist,
    updateProfileImg,
};
