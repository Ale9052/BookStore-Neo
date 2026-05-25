require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Esquemas (Modelos)
const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String, password: String, role: String }));
const Book = mongoose.model('Book', new mongoose.Schema({ title: String, author: String, category: String, price: Number, image: String, full_link: String, badge: String }));
const CartItem = mongoose.model('CartItem', new mongoose.Schema({ user_id: Number, book_id: Number, quantity: Number }));
const Order = mongoose.model('Order', new mongoose.Schema({ user_email: String, book_id: Number, title: String, price: Number }));

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- AUTENTICACIÓN ---
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.json({ success: false, message: 'El correo ya está registrado.' });

  const newUser = await User.create({ name, email, password, role: 'user' });
  res.json({ success: true, userId: newUser._id, role: newUser.role, name: newUser.name });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    res.json({ success: true, userId: user._id, role: user.role, name: user.name });
  } else {
    res.json({ success: false, message: 'Credenciales incorrectas.' });
  }
});

// --- OPERACIONES DE LIBROS ---
app.get('/books', async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

app.post('/books', async (req, res) => {
  const newBook = await Book.create(req.body);
  res.json({ success: true, bookId: newBook._id });
});

app.delete('/books/:id', async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- CARRITO ---
app.get('/cart/:userId', async (req, res) => {
  const cartItems = await CartItem.find({ user_id: req.params.userId });
  res.json(cartItems);
});

app.post('/cart', async (req, res) => {
  const newItem = await CartItem.create(req.body);
  res.json({ success: true });
});

app.delete('/cart/:itemId', async (req, res) => {
  await CartItem.findByIdAndDelete(req.params.itemId);
  res.json({ success: true });
});

// --- ADMINISTRADOR ---
app.post('/admin/sales', async (req, res) => {
  await Order.create(req.body);
  res.json({ success: true });
});

app.get('/admin/sales', async (req, res) => {
  const sales = await Order.find();
  res.json(sales);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
