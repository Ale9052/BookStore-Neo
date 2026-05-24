const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

// IMPORTANTE: Permitir que tu página de GitHub Pages acceda al servidor sin bloqueos CORS
app.use(cors());
app.use(express.json());

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./usuarios.db', (err) => {
    if (err) console.error("Error al abrir base de datos:", err.message);
    else console.log("Conectado con éxito a la base de datos SQLite.");
});

// Crear la tabla si no existe (fíjate en los nombres de las columnas: nombre, correo, contrasena)
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    correo TEXT UNIQUE,
    contrasena TEXT
)`);

// ROUTER 1: Registro de usuarios
app.post('/register', (req, res) => {
    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    const query = `INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)`;
    db.run(query, [nombre, correo, contrasena], function(err) {
        if (err) {
            // Si el correo ya existe, SQLite lanzará un error de restricción UNIQUE
            if (err.message.includes("UNIQUE")) {
                return res.status(400).json({ success: false, message: "Este correo ya está registrado." });
            }
            return res.status(500).json({ success: false, message: "Error interno al guardar en la base de datos." });
        }
        res.status(201).json({ success: true, message: "¡Usuario registrado con éxito!" });
    });
});

// ROUTER 2: Inicio de sesión (Login)
app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: "Correo y contraseña requeridos." });
    }

    const query = `SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?`;
    db.get(query, [correo, contrasena], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error en el servidor." });
        }
        if (row) {
            res.json({ success: true, message: "¡Ingreso exitoso!", usuario: { nombre: row.nombre, correo: row.correo } });
        } else {
            res.status(401).json({ success: false, message: "El correo o la contraseña son incorrectos." });
        }
    });
});

// Asignar puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
