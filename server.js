require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Esquemas
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
}));

const Book = mongoose.model('Book', new mongoose.Schema({
  title: String,
  author: String,
  category: String,
  price: Number,
  image: String,
  full_link: String,
  badge: String
}));

const CartItem = mongoose.model('CartItem', new mongoose.Schema({
  user_id: String,
  book_id: String,
  quantity: { type: Number, default: 1 }
}));

const Order = mongoose.model('Order', new mongoose.Schema({
  user_email: String,
  book_id: String,
  title: String,
  price: Number
}));

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ================= RUTAS =================

// Inicio
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Registro
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: 'El correo ya existe'
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: 'user'
    });

    res.json({
      success: true,
      userId: newUser._id,
      role: newUser.role,
      name: newUser.name
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (user) {
      res.json({
        success: true,
        userId: user._id,
        role: user.role,
        name: user.name
      });
    } else {
      res.json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Obtener libros
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Crear libro
app.post('/books', async (req, res) => {
  try {
    const newBook = await Book.create(req.body);

    res.json({
      success: true,
      bookId: newBook._id
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// EDITAR libro
app.put('/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ELIMINAR un libro
app.delete('/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// BORRAR TODO inventario
app.delete('/admin/books/clear-all', async (req, res) => {
  try {
    await Book.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Obtener carrito
app.get('/cart/:userId', async (req, res) => {
  try {
    const cartItems = await CartItem.find({
      user_id: req.params.userId
    });
    res.json(cartItems);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Agregar al carrito
app.post('/cart', async (req, res) => {
  try {
    await CartItem.create(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Eliminar item del carrito
app.delete('/cart/:id', async (req, res) => {
  try {
    await CartItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Registrar venta
app.post('/admin/sales', async (req, res) => {
  try {
    await Order.create(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Ver ventas
app.get('/admin/sales', async (req, res) => {
  try {
    const sales = await Order.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
