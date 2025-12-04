const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // положите index.html и app.js в public/

// Простейшее in-memory хранилище пользователей (для теста)
const users = {};

// /api/init — создаёт/возвращает профиль
app.post('/api/init', (req, res) => {
  const { id, username } = req.body || {};
  const uid = id || `u_${Date.now()}`;
  if (!users[uid]) {
    users[uid] = { id: uid, username: username || 'guest', balance: 1000, totalWins: 0, referrals: 0 };
  }
  res.json({ success: true, user: users[uid] });
});

// /api/play/coin — простая логика 50/50
app.post('/api/play/coin', (req, res) => {
  const { userId, bet, choice } = req.body || {};
  const uid = userId || 'demo';
  if (!users[uid]) {
    users[uid] = { id: uid, username: 'guest', balance: 1000, totalWins: 0, referrals: 0 };
  }
  const user = users[uid];

  const isWin = Math.random() > 0.5;
  const result = isWin ? choice : (choice === 'Орёл' ? 'Решка' : 'Орёл');
  let winnings = 0;
  if (isWin) {
    winnings = Number(bet) * 2;
    user.balance += winnings;
    user.totalWins = (user.totalWins || 0) + 1;
  } else {
    user.balance -= Number(bet);
  }

  res.json({
    win: !!isWin,
    winnings,
    result,
    newBalance: user.balance,
    totalWins: user.totalWins,
    referrals: user.referrals
  });
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port} (static files served from /public)`);
});
