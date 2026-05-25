const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MongoDB (Asegúrate de configurar MONGODB_URI en Render)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Servidor conectado a MongoDB'))
    .catch(err => console.error('Error de conexión:', err));

// Esquema del libro
const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    category: String,
    price: Number,
    image: String,
    full_link: String
});
const Book = mongoose.model('Book', bookSchema);

// RUTAS
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
        // Evitar procesar si el ID es inválido
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ success: false, message: "ID inválido" });
        }
        
        const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBook) return res.status(404).json({ success: false, message: "Libro no encontrado" });
        
        res.json({ success: true, data: updatedBook });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/books/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
