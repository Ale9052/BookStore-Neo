const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const dbPath = path.join(__dirname, 'libreria.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error SQLite:', err.message);
    } else {
        console.log('Base de datos conectada.');
        
        // Se añade e inspecciona que exista la columna 'nombre' de forma segura
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            correo TEXT UNIQUE,
            contrasena TEXT,
            rol TEXT DEFAULT 'cliente'
        )`);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// OPERACIÓN REGISTRO ACTUALIZADA CON CAMPO NOMBRE
app.post('/register', (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan campos mandatorios obligatorios.' });
    }

    const query = `INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, 'cliente')`;
    db.run(query, [nombre, correo, contrasena], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: 'Este correo ya existe.' });
            }
            return res.status(500).json({ success: false, message: 'Fallo interno en la base de datos.' });
        }
        res.json({ success: true, message: 'Usuario creado con éxito.' });
    });
});

app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Completa todos los parámetros.' });
    }

    const query = `SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?`;
    db.get(query, [correo, contrasena], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error de servidor.' });
        }
        if (!row) {
            return res.status(401).json({ success: false, message: 'Datos de inicio incorrectos.' });
        }
        res.json({
            success: true,
            message: 'Autenticado con éxito.',
            user: { id: row.id, nombre: row.nombre, correo: row.correo, rol: row.rol }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
