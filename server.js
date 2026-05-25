const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de MongoDB
const MONGO_URI = process.env.MONGODB_URI || "TU_URL_DE_MONGODB"; 
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error de conexión:', err));

// Definición del Modelo
const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    category: String,
    price: Number,
    image: String,
    full_link: String
});
const Book = mongoose.model('Book', bookSchema);

// Rutas CRUD
app.get('/books', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/books', async (req, res) => {
    try {
        const newBook = new Book(req.body);
        await newBook.save();
        res.json({ success: true, data: newBook });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBook) return res.status(404).json({ success: false, message: "No encontrado" });
        res.json({ success: true, data: updatedBook });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/books/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/admin/books/clear-all', async (req, res) => {
    try {
        await Book.deleteMany({});
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
