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
        console.log('Base de datos conectada con éxito.');
        
        // Crea la tabla garantizando que el campo 'nombre' exista
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

// REGISTRO DE USUARIO CON NOMBRE (SIN PEDIR ROLES EXTERNOS)
app.post('/register', (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan campos mandatorios.' });
    }

    const query = `INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, 'cliente')`;
    db.run(query, [nombre, correo, contrasena], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ success: false, message: 'Este correo ya se encuentra registrado.' });
            }
            return res.status(500).json({ success: false, message: 'Fallo interno en la base de datos.' });
        }
        res.json({ success: true, message: 'Cuenta creada con éxito.' });
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
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
        }
        res.json({
            success: true,
            message: 'Autenticación exitosa.',
            user: { id: row.id, nombre: row.nombre, correo: row.correo, rol: row.rol }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
