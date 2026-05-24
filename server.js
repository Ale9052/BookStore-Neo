const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database('./libreria.db');

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
    status TEXT DEFAULT 'Pagado',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    book_title TEXT,
    price REAL,
    quantity INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

  // Migración segura por si la tabla ya existía previamente
  db.get("PRAGMA table_info(books)", (err, rows) => {
    db.run(`ALTER TABLE books ADD COLUMN category TEXT DEFAULT 'Programación'`, () => {});
    db.run(`ALTER TABLE books ADD COLUMN full_link TEXT`, () => {});
  });

  db.run(`INSERT OR IGNORE INTO users (id, email, password, role)
          VALUES (1, 'admin@gmail.com', '123456', 'admin')`);
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, error: 'Campos vacíos.' });
  if (!email.toLowerCase().endsWith('@gmail.com')) return res.json({ success: false, error: 'Debe ser @gmail.com.' });
  if (password.length < 6) return res.json({ success: false, error: 'Mínimo 6 caracteres.' });

  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], function(err) {
    if (err) return res.json({ success: false, error: 'Este correo ya se encuentra registrado.' });
    res.json({ success: true });
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, user) => {
    if (!user) return res.json({ success: false, error: 'Credenciales incorrectas.' });
    res.json({ success: true, id: user.id, email: user.email, role: user.role });
  });
});

app.get('/books', (req, res) => {
  db.all('SELECT * FROM books', [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows || []);
  });
});

app.post('/books', (req, res) => {
  const { title, author, category, price, image, full_link, badge } = req.body;
  const numericPrice = parseFloat(price) || 0.0;
  db.run('INSERT INTO books (title, author, category, price, image, full_link, badge) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [title, author, category, numericPrice, image, full_link, badge], function(err) {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true });
  });
});

app.put('/books/:id', (req, res) => {
  const { title, author, category, price, image, full_link, badge } = req.body;
  const bookId = req.params.id;
  const numericPrice = parseFloat(price) || 0.0;

  const query = `UPDATE books SET title = ?, author = ?, category = ?, price = ?, image = ?, full_link = ?, badge = ? WHERE id = ?`;
  db.run(query, [title, author, category, numericPrice, image, full_link, badge, bookId], function(err) {
    if (err) return res.json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

app.delete('/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.json({ success: false });
    res.json({ success: true });
  });
});

app.get('/cart/:userId', (req, res) => {
  const query = `SELECT cart.id as cartItemId, books.id as bookId, books.title, books.price, books.image, cart.quantity 
                 FROM cart JOIN books ON cart.book_id = books.id WHERE cart.user_id = ?`;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows || []);
  });
});

app.post('/cart', (req, res) => {
  const { userId, bookId } = req.body;
  db.get('SELECT * FROM cart WHERE user_id = ? AND book_id = ?', [userId, bookId], (err, row) => {
    if (row) {
      db.run('UPDATE cart SET quantity = quantity + 1 WHERE id = ?', [row.id], () => res.json({ success: true }));
    } else {
      db.run('INSERT INTO cart (user_id, book_id) VALUES (?, ?)', [userId, bookId], () => res.json({ success: true }));
    }
  });
});

app.delete('/cart/:cartItemId', (req, res) => {
  db.run('DELETE FROM cart WHERE id = ?', [req.params.cartItemId], () => res.json({ success: true }));
});

app.post('/checkout', (req, res) => {
  const { userId, userEmail, total } = req.body;
  const dateStr = new Date().toLocaleString('es-GT', { timeZone: 'America/Guatemala' });

  db.serialize(() => {
    const cartQuery = `SELECT books.title, books.price, cart.quantity FROM cart 
                       JOIN books ON cart.book_id = books.id WHERE cart.user_id = ?`;
    
    db.all(cartQuery, [userId], (err, items) => {
      if (err || !items || items.length === 0) return res.json({ success: false, error: 'Vacío' });

      db.run('INSERT INTO orders (user_id, user_email, total, date) VALUES (?, ?, ?, ?)', 
        [userId, userEmail, total, dateStr], function(err) {
          if (err) return res.json({ success: false });
          const orderId = this.lastID;

          const stmt = db.prepare('INSERT INTO order_items (order_id, book_title, price, quantity) VALUES (?, ?, ?, ?)');
          items.forEach(item => {
            stmt.run(orderId, item.title, item.price, item.quantity);
          });
          stmt.finalize();

          db.run('DELETE FROM cart WHERE user_id = ?', [userId], () => {
            res.json({ success: true });
          });
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

app.get('/admin/sales', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, orders) => {
    if (err) return res.json([]);
    res.json(orders || []);
  });
});

app.delete('/admin/sales', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM order_items', [], (err) => {
      db.run('DELETE FROM orders', [], function(err) {
        res.json({ success: true });
      });
    });
  });
});

app.delete('/admin/sales/:id', (req, res) => {
  const orderId = req.params.id;
  db.serialize(() => {
    db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], () => {
      db.run('DELETE FROM orders WHERE id = ?', [orderId], () => {
        res.json({ success: true });
      });
    });
  });
});

app.listen(PORT, () => console.log(`Servidor ejecutándose en http://localhost:${PORT}`));