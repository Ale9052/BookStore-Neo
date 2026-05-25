const express = require('express');
const Database = require('better-sqlite3'); // Librería ultra estable para Render
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

// Ruta de la base de datos en el directorio temporal de Render
const dbPath = path.join('/tmp', 'libreria.db');
const db = new Database(dbPath);

// Creación de tablas de forma síncrona y segura
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    category TEXT,
    price REAL,
    image TEXT,
    full_link TEXT,
    badge TEXT
  );

  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    book_id INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT,
    total REAL,
    date TEXT,
    status TEXT DEFAULT 'Pagado'
  );
`);

// Crear administrador por defecto si no existe
const adminEmail = 'admin@gmail.com';
const checkAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
if (!checkAdmin) {
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', adminEmail, 'admin123', 'admin');
}

// --- AUTENTICACIÓN ---
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  try {
    const insert = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = insert.run(name, email, password);
    res.json({ success: true, userId: result.lastInsertRowid, role: 'user', name: name });
  } catch (err) {
    res.json({ success: false, message: 'El correo ya está registrado o hubo un error.' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@gmail.com' && password === 'admin123') {
    return res.json({ success: true, userId: 1, role: 'admin', name: 'Admin' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json({ success: true, userId: user.id, role: user.role, name: user.name || user.email });
    } else {
      res.json({ success: false, message: 'Credenciales incorrectas.' });
    }
  } catch (err) {
    res.json({ success: false, message: 'Error en el servidor.' });
  }
});

// --- RUTAS DE LIBROS ---
app.get('/books', (req, res) => {
  try {
    const books = db.prepare('SELECT * FROM books').all();
    res.json(books);
  } catch (err) {
    res.json([]);
  }
});

app.post('/books', (req, res) => {
  const { title, author, category, price, image, full_link, badge } = req.body;
  try {
    const insert = db.prepare('INSERT INTO books (title, author, category, price, image, full_link, badge) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const result = insert.run(title, author, category, price, image, full_link, badge || '');
    res.json({ success: true, bookId: result.lastInsertRowid });
  } catch (err) {
    res.json({ success: false });
  }
});

app.delete('/books/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

// --- HISTORIAL DE VENTAS ---
app.get('/admin/sales', (req, res) => {
  try {
    const sales = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
    res.json(sales);
  } catch (err) {
    res.json([]);
  }
});

app.delete('/admin/sales', (req, res) => {
  try {
    db.prepare('DELETE FROM orders').run();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
