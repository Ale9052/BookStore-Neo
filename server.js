const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors({ origin: "*" })); // Permite conexiones de cualquier origen
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error DB:', err));

// Esquemas
const Book = mongoose.model('Book', new mongoose.Schema({ title: String, author: String, category: String, price: Number, image: String, full_link: String }));
const User = mongoose.model('User', new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: { type: String, default: 'user' } }));
const Cart = mongoose.model('Cart', new mongoose.Schema({ user_id: String, book_id: String }));
const Sale = mongoose.model('Sale', new mongoose.Schema({ user_email: String, book_id: String, title: String, price: Number }));

// --- RUTAS ---
// Autenticación
app.post('/register', async (req, res) => {
    try { await User.create(req.body); res.json({ success: true }); }
    catch (err) { res.status(500).json({ success: false, message: "Error al registrar" }); }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email, password: req.body.password });
        if (!user) return res.status(401).json({ success: false, message: "Credenciales inválidas" });
        res.json({ success: true, userId: user._id, role: user.role, name: user.name });
    } catch (err) { res.status(500).json({ success: false, message: "Error" }); }
});

// Libros
app.get('/books', async (req, res) => { res.json(await Book.find()); });
app.post('/books', async (req, res) => { const book = await Book.create(req.body); res.json({ success: true, data: book }); });
app.put('/books/:id', async (req, res) => { 
    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated }); 
});
app.delete('/books/:id', async (req, res) => { await Book.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/admin/books/clear-all', async (req, res) => { await Book.deleteMany({}); res.json({ success: true }); });

// Carrito y Ventas
app.post('/cart', async (req, res) => { await Cart.create(req.body); res.json({ success: true }); });
app.get('/cart/:userId', async (req, res) => { res.json(await Cart.find({ user_id: req.params.userId })); });
app.delete('/cart/:id', async (req, res) => { await Cart.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.post('/admin/sales', async (req, res) => { await Sale.create(req.body); res.json({ success: true }); });
app.get('/admin/sales', async (req, res) => { res.json(await Sale.find()); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en ${PORT}`));
