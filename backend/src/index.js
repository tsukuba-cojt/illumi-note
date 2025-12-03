require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON ボディを扱うためのミドルウェア
app.use(express.json());
app.use(cookieParser());

// CORS 設定（フロントの Vite 開発サーバからのアクセスを許可）
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// Auth API ルーター
app.use('/api/auth', authRouter);

// ヘルスチェック用エンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// サーバ起動
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
