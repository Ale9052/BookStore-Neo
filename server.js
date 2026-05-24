const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Inicialización de la Base de Datos SQLite
const db = new sqlite3.Database('./usuarios.db', (err) => {
    if (err) console.error("Error en DB:", err.message);
    else console.log("Conectado a la base de datos SQLite con éxito.");
});

// Crear tabla obligatoria de usuarios
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    correo TEXT UNIQUE,
    contrasena TEXT
)`);

// Endpoint: Registro de usuarios
app.post('/register', (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, message: "Campos incompletos." });
    }

    const query = `INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)`;
    db.run(query, [nombre, correo, contrasena], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.status(400).json({ success: false, message: "Este correo electrónico ya fue registrado." });
            }
            return res.status(500).json({ success: false, message: "Error interno del servidor." });
        }
        res.status(201).json({ success: true, message: "¡Usuario creado exitosamente!" });
    });
});

// Endpoint: Login de usuarios
app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: "Faltan credenciales de acceso." });
    }

    const query = `SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?`;
    db.get(query, [correo, contrasena], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error de lectura de datos." });
        }
        if (row) {
            res.json({ 
                success: true, 
                message: "Acceso concedido.", 
                usuario: { nombre: row.nombre, correo: row.correo } 
            });
        } else {
            res.status(401).json({ success: false, message: "Credenciales de acceso inválidas." });
        }
    });
});

// Configuración de puertos para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo y escuchando en el puerto ${PORT}`);
});
