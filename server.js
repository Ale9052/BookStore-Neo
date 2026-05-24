const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); 

const app = express();
// Ajuste para Render: usa el puerto asignado por la plataforma o el 3000 localmente
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
// Sirve archivos estáticos (html, css, js) desde la raíz del proyecto
app.use(express.static(__dirname));

// Solución definitiva al error "Cannot GET /" en Render
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ajuste para Render: la base de datos se guarda en la carpeta /tmp con ruta absoluta segura
const dbPath = path.join('/tmp', 'libreria.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    status TEXT DEFAULT 'Completado'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    book_title TEXT,
    quantity INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

  // SOLUCIÓN AL ADMIN: Insertar automáticamente al administrador si no existe en la base de datos
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin123';
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (!row) {
      db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [adminEmail, adminPassword, 'admin'], (err) => {
        if (!err) {
          console.log('Usuario administrador inicializado correctamente (admin@gmail.com).');
        }
      });
    }
  });
});

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], function(err) {
    if (err) return res.json({ success: false, message: 'El usuario ya existe o los datos son inválidos.' });
    res.json({ success: true, userId: this.lastID, role: 'user' });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@gmail.com' && password === 'admin123') {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (row) {
        res.json({ success: true, userId: row.id, role: 'admin' });
      } else {
        db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, password, 'admin'], function() {
          res.json({ success: true, userId: this.lastID, role: 'admin' });
        });
      }
    });
    return;
  }
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err || !row) return res.json({ success: false, message: 'Credenciales incorrectas.' });
    res.json({ success: true, userId: row.id, role: row.role });
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

app.put('/books/:id', (req, res) => {
  const { title, author, category, price, image, full_link, badge } = req.body;
  db.run('UPDATE books SET title=?, author=?, category=?, price=?, image=?, full_link=?, badge=? WHERE id=?',
    [title, author, category, price, image, full_link, badge, req.params.id], function(err) {
      if (err) return res.json({ success: false });
      res.json({ success: true });
  });
});

app.delete('/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

// --- RUTAS DEL CARRITO ---

app.get('/cart/:userId', (req, res) => {
  const query = `SELECT cart.id as cartItemId, books.id as id, books.title, books.author, books.price, books.image, cart.quantity 
                 FROM cart JOIN books ON cart.book_id = books.id WHERE cart.user_id = ?`;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

app.post('/cart', (req, res) => {
  const { user_id, book_id } = req.body;
  db.get('SELECT * FROM cart WHERE user_id = ? AND book_id = ?', [user_id, book_id], (err, row) => {
    if (row) {
      db.run('UPDATE cart SET quantity = quantity + 1 WHERE id = ?', [row.id], function() {
        res.json({ success: true });
      });
    } else {
      db.run('INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, 1)', [user_id, book_id], function() {
        res.json({ success: true });
      });
    }
  });
});

app.put('/cart/:cartItemId', (req, res) => {
  const { quantity } = req.body;
  db.run('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, req.params.cartItemId], function() {
    res.json({ success: true });
  });
});

app.delete('/cart/:cartItemId', (req, res) => {
  db.run('DELETE FROM cart WHERE id = ?', [req.params.cartItemId], function() {
    res.json({ success: true });
  });
});

// --- RUTAS DE ÓRDENES Y COMPRAS ---

app.post('/orders', (req, res) => {
  const { userId, userEmail, total, items } = req.body;
  const dateStr = new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' });

  db.run('INSERT INTO orders (user_id, user_email, total, date) VALUES (?, ?, ?, ?)', [userId, userEmail, total, dateStr], function(err) {
    if (err) return res.json({ success: false });
    const orderId = this.lastID;

    db.serialize(() => {
      const stmt = db.prepare('INSERT INTO order_items (order_id, book_title, quantity) VALUES (?, ?, ?)');
      items.forEach(item => {
        stmt.run(orderId, item.title, item.quantity);
      });
      stmt.finalize();

      db.run('DELETE FROM cart WHERE user_id = ?', [userId], () => {
        res.json({ success: true });
      });
    });
  });
});

app.get('/users/:userId/purchased', (req, res) => {
  const query = `SELECT DISTINCT order_items.book_title FROM order_items 
                 JOIN orders ON order_items.order_id = orders.id 
                 WHERE orders.user_id = ?`;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.json([]);
    const titles = rows.map(r => r.book_title);
    res.json(titles);
  });
});

// --- RUTAS DE ADMINISTRACIÓN ---

app.get('/admin/sales', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, orders) => {
    if (err) return res.json([]);
    res.json(orders || []);
  });
});

app.delete('/admin/sales', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM order_items', [], () => {
      db.run('DELETE FROM orders', [], function() {
        res.json({ success: true });
      });
    });
  });
});

app.delete('/admin/sales/:id', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM order_items WHERE order_id = ?', [req.params.id], () => {
      db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function() {
        res.json({ success: true });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de BookStore Neo corriendo en el puerto ${PORT}`);
});
