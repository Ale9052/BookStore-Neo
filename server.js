const express = require('express');
const sqlite3 = require('sqlite3').verbose(); // Regresamos al estándar compatible con rebuild
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta persistente/temporal en Render para la base de datos
const dbPath = path.join('/tmp', 'libreria.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    category TEXT,
    price REAL,
    image TEXT,
    full_link TEXT,
    badge TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    book_id INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(book_id) REFERENCES books(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT,
    total REAL,
    date TEXT,
    status TEXT DEFAULT 'Pagado'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    book_title TEXT,
    quantity INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

  // Administrador por defecto
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin123';
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin', adminEmail, adminPassword, 'admin']);
    }
  });
});

// --- AUTENTICACIÓN ---
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], function(err) {
    if (err) return res.json({ success: false, message: 'El correo ya está registrado.' });
    res.json({ success: true, userId: this.lastID, role: 'user', name: name });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@gmail.com' && password === 'admin123') {
    res.json({ success: true, userId: 1, role: 'admin', name: 'Admin' });
    return;
  }
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err || !row) return res.json({ success: false, message: 'Credenciales incorrectas.' });
    res.json({ success: true, userId: row.id, role: row.role, name: row.name || row.email });
  });
});

// --- RUTAS DE LIBROS ---
app.get('/books', (req, res) => {
  db.all('SELECT * FROM books', [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.post('/books', (req, res) => {
  const { title, author, category, price, image, full_link, badge } = req.body;
  db.run('INSERT INTO books (title, author, category, price, image, full_link, badge) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, author, category, price, image, full_link, badge], function(err) {
      if (err) return res.json({ success: false });
      res.json({ success: true, bookId: this.lastID });
  });
});

app.delete('/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

// --- HISTORIAL DE VENTAS ---
app.get('/admin/sales', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.delete('/admin/sales', (req, res) => {
  db.run('DELETE FROM orders', [], () => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
