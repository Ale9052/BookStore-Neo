const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Configuración de CORS permitiendo todo para depuración
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(express.json());

// Conexión
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Conectado'))
    .catch(err => console.error('❌ Error DB:', err));

// Esquemas
const Book = mongoose.model('Book', new mongoose.Schema({ title: String, author: String, category: String, price: Number, image: String, full_link: String }));
const User = mongoose.model('User', new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: String }));
const Cart = mongoose.model('Cart', new mongoose.Schema({ user_id: String, book_id: String }));

// API: Libros
app.get('/books', async (req, res) => { res.json(await Book.find()); });
app.post('/books', async (req, res) => { const book = await Book.create(req.body); res.json({ success: true, data: book }); });
app.put('/books/:id', async (req, res) => {
    try {
        const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (e) { res.status(500).json({ success: false }); }
});
app.delete('/books/:id', async (req, res) => { await Book.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// API: Auth
app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email, password: req.body.password });
    if (!user) return res.status(401).json({ success: false });
    res.json({ success: true, userId: user._id, role: user.role, name: user.name });
});

app.listen(process.env.PORT || 3000, () => console.log('Servidor activo'));
