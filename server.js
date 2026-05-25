const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS Explícita para dar acceso completo a GitHub Pages
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.use(express.static(__dirname));

// Rutas de almacenamiento persistente en la instancia de Render
const DATA_DIR = '/tmp';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CART_FILE = path.join(DATA_DIR, 'cart.json');

const initFile = (filePath, initialData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
  }
};

// Crear archivos base si no existen con el usuario Administrador inicializado
initFile(USERS_FILE, [{ id: 1, name: 'Admin', email: 'admin@gmail.com', password: 'admin123', role: 'admin' }]);
initFile(BOOKS_FILE, []);
initFile(ORDERS_FILE, []);
initFile(CART_FILE, []);

const readData = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeData = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- AUTENTICACIÓN ---
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const users = readData(USERS_FILE);

  if (users.some(u => u.email === email)) {
    return res.json({ success: false, message: 'El correo electrónico ya está registrado.' });
  }

  const newUser = {
    id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
    name,
    email,
    password,
    role: 'user'
  };

  users.push(newUser);
  writeData(USERS_FILE, users);
  res.json({ success: true, userId: newUser.id, role: newUser.role, name: newUser.name });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readData(USERS_FILE);

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, userId: user.id, role: user.role, name: user.name });
  } else {
    res.json({ success: false, message: 'Las credenciales introducidas son incorrectas.' });
  }
});

// --- OPERACIONES DE LIBROS ---
app.get('/books', (req, res) => {
  res.json(readData(BOOKS_FILE));
});

app.post('/books', (req, res) => {
  const { title, author, category, price, image, full_link, badge } = req.body;
  const books = readData(BOOKS_FILE);

  const newBook = {
    id: books.length > 0 ? books[books.length - 1].id + 1 : 1,
    title,
    author,
    category,
    price: parseFloat(price) || 0,
    image,
    full_link,
    badge: badge || ''
  };

  books.push(newBook);
  writeData(BOOKS_FILE, books);
  res.json({ success: true, bookId: newBook.id });
});

app.delete('/books/:id', (req, res) => {
  const bookId = parseInt(req.params.id);
  let books = readData(BOOKS_FILE);
  books = books.filter(b => b.id !== bookId);
  writeData(BOOKS_FILE, books);
  res.json({ success: true });
});

// --- CARRITO DE COMPRAS ---
app.get('/cart/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const cart = readData(CART_FILE);
  const books = readData(BOOKS_FILE);

  const userCart = cart.filter(c => c.user_id === userId).map(cItem => {
    const book = books.find(b => b.id === cItem.book_id);
    return {
      cartItemId: cItem.id,
      id: cItem.book_id,
      title: book ? book.title : 'No disponible',
      author: book ? book.author : '',
      price: book ? book.price : 0,
      image: book ? book.image : '',
      quantity: cItem.quantity
    };
  });

  res.json(userCart);
});

app.post('/cart', (req, res) => {
  const { user_id, book_id } = req.body;
  const cart = readData(CART_FILE);

  const newCartItem = {
    id: cart.length > 0 ? cart[cart.length - 1].id + 1 : 1,
    user_id: parseInt(user_id),
    book_id: parseInt(book_id),
    quantity: 1
  };

  cart.push(newCartItem);
  writeData(CART_FILE, cart);
  res.json({ success: true });
});

// --- PANEL DE CONTROL DE ADMINISTRADOR ---
app.get('/admin/sales', (req, res) => {
  res.json(readData(ORDERS_FILE));
});

app.delete('/admin/sales', (req, res) => {
  writeData(ORDERS_FILE, []);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor de alto rendimiento corriendo en puerto ${PORT}`);
});
