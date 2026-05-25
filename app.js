const API_URL = "https://bookstore-neo.onrender.com"; 
let allBooksLocal = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();

    // Formulario de Administración
    const adminForm = document.getElementById('adminBookForm');
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
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

            const isEditing = id && id !== "undefined" && id.length > 5; // Validar ID mongo
            const url = isEditing ? `${API_URL}/books/${id}` : `${API_URL}/books`;
            const method = isEditing ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookData)
                });
                if ((await res.json()).success) {
                    alert("¡Guardado correctamente!");
                    document.getElementById('adminBookForm').reset();
                    document.getElementById('adminBookId').value = '';
                    await loadCatalog();
                }
            } catch (err) { alert("Error de conexión"); }
        });
    }
});

async function loadCatalog() {
    try {
        const res = await fetch(`${API_URL}/books`, { cache: 'no-cache' });
        allBooksLocal = await res.json();
        renderInventoryTable(allBooksLocal);
    } catch (err) { console.error(err); }
}

function startEditBook(id) {
    const book = allBooksLocal.find(b => (b._id === id || b.id === id));
    if (!book) return;
    document.getElementById('adminBookId').value = book._id || book.id;
    document.getElementById('adminTitle').value = book.title;
    document.getElementById('adminAuthor').value = book.author;
    document.getElementById('adminCategory').value = book.category;
    document.getElementById('adminPrice').value = book.price;
    document.getElementById('adminImage').value = book.image;
    document.getElementById('adminLink').value = book.full_link;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderInventoryTable(books) {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    books.forEach(book => {
        const id = book._id || book.id;
        tableBody.innerHTML += `<tr>
            <td><img src="${book.image}" style="width:30px;"></td>
            <td>${book.title}</td>
            <td>Q${book.price}</td>
            <td><button onclick="startEditBook('${id}')">Edit</button></td>
        </tr>`;
    });
}
