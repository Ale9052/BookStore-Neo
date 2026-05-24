const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURACIONES INTERNAS FUNDAMENTALES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// PROCESAMIENTO SQLITE
const dbPath = path.join(__dirname, 'libreria.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error SQLite:', err.message);
    } else {
        console.log('Base de datos conectada.');
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            correo TEXT UNIQUE,
            contrasena TEXT,
            rol TEXT DEFAULT 'cliente'
        )`);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', (req, res) => {
    const { correo, contrasena, rol } = req.body;
    const userRole = rol || 'cliente';

    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan campos mandatorios.' });
    }

    const query = `INSERT INTO usuarios (correo, contrasena, rol) VALUES (?, ?, ?)`;
    db.run(query, [correo, contrasena, userRole], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: 'Este correo ya existe.' });
            }
            return res.status(500).json({ success: false, message: 'Fallo interno.' });
        }
        res.json({ success: true, message: 'Registrado con éxito.' });
    });
});

app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Completa los parámetros.' });
    }

    const query = `SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?`;
    db.get(query, [correo, contrasena], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error de servidor.' });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: 'Datos incorrectos.' });
        }
        res.json({
            success: true,
            message: 'Autenticado.',
            user: { id: row.id, correo: row.correo, rol: row.rol }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
