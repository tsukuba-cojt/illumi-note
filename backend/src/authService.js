const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// シンプルなメモリ上のユーザーストア（MVP 用）
// サーバー再起動でクリアされる点に注意。
const users = [];
let nextId = 1;

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-token-secret';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

async function createUser({ email, displayName, password }) {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: nextId++,
    email,
    passwordHash,
    displayName,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  return user;
}

function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

function findUserById(id) {
  return users.find((u) => u.id === id);
}

async function verifyUserPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

function createTokens(user) {
  const payload = { userId: user.id, email: user.email };

  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  verifyUserPassword,
  createTokens,
  verifyRefreshToken,
  verifyAccessToken,
  toPublicUser,
};
