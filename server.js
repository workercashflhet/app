const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(bodyParser.json());

// Подключение к базе данных SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err);
    } else {
        console.log('Подключено к SQLite базе данных');
        // Создаем таблицу пользователей
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE
        )`);
    }
});

// Базовый маршрут
app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

// Пример API эндпоинтов
app.post('/api/users', (req, res) => {
    const { name, email } = req.body;
    db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email });
    });
});

app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});