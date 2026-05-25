const API_URL = "https://bookstore-neo.onrender.com";
let allBooksLocal = [];

async function loadCatalog() {
    try {
        const res = await fetch(`${API_URL}/books`, { cache: 'no-cache' });
        allBooksLocal = await res.json();
        renderInventoryTable(allBooksLocal);
    } catch (err) { console.error("Error al cargar:", err); }
}

async function handleAdminSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('adminBookId').value;
    const bookData = {
        title: document.getElementById('adminTitle').value,
        author: document.getElementById('adminAuthor').value,
        category: document.getElementById('adminCategory').value,
        price: parseFloat(document.getElementById('adminPrice').value),
        image: document.getElementById('adminImage').value,
        full_link: document.getElementById('adminLink').value
    };

    const isEdit = id && id.length > 5; // Validación simple de ID MongoDB
    const url = isEdit ? `${API_URL}/books/${id}` : `${API_URL}/books`;
    
    try {
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookData)
        });
        if ((await res.json()).success) {
            alert("Acción realizada con éxito");
            document.getElementById('adminBookForm').reset();
            document.getElementById('adminBookId').value = '';
            await loadCatalog();
        }
    } catch (e) { alert("Error de conexión"); }
}

function startEditBook(id) {
    const book = allBooksLocal.find(b => b._id === id || b.id === id);
    if (!book) return alert("Libro no encontrado");
    
    document.getElementById('adminBookId').value = book._id || book.id;
    document.getElementById('adminTitle').value = book.title;
    document.getElementById('adminAuthor').value = book.author;
    document.getElementById('adminCategory').value = book.category;
    document.getElementById('adminPrice').value = book.price;
    document.getElementById('adminImage').value = book.image;
    document.getElementById('adminLink').value = book.full_link;
}

function renderInventoryTable(books) {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = books.map(b => `
        <tr>
            <td>${b.title}</td>
            <td><button onclick="startEditBook('${b._id}')">Editar</button></td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();
    const form = document.getElementById('adminBookForm');
    if (form) form.addEventListener('submit', handleAdminSubmit);
});
