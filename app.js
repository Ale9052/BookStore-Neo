require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// MODELOS
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

// HOME
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// REGISTER
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

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    res.json({
      success: true,
      userId: user._id,
      role: user.role,
      name: user.name
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ================= LIBROS =================

// Obtener libros
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch {
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
  } catch {
    res.status(500).json({ success: false });
  }
});

// Editar libro
app.put('/books/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Libro no encontrado'
      });
    }

    res.json({
      success: true,
      book: updatedBook
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Eliminar un libro
app.delete('/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Borrar TODO inventario
app.delete('/admin/books/clear-all', async (req, res) => {
  try {
    await Book.deleteMany({});
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================= CARRITO =================

// Obtener carrito
app.get('/cart/:userId', async (req, res) => {
  try {
    const cartItems = await CartItem.find({
      user_id: req.params.userId
    });
    res.json(cartItems);
  } catch {
    res.status(500).json([]);
  }
});

// Agregar al carrito
app.post('/cart', async (req, res) => {
  try {
    await CartItem.create(req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Eliminar del carrito
app.delete('/cart/:id', async (req, res) => {
  try {
    await CartItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ================= VENTAS =================

// Registrar venta
app.post('/admin/sales', async (req, res) => {
  try {
    await Order.create(req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Ver ventas
app.get('/admin/sales', async (req, res) => {
  try {
    const sales = await Order.find();
    res.json(sales);
  } catch {
    res.status(500).json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
