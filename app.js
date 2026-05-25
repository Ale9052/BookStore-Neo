const API_URL = "https://bookstore-neo.onrender.com"; 
let allBooksLocal = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();

    // Manejo del formulario de administración (Crear o Editar)
    document.getElementById('adminBookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('adminBookId').value;
        const bookData = {
            title: document.getElementById('adminTitle').value.trim(),
            author: document.getElementById('adminAuthor').value.trim(),
            category: document.getElementById('adminCategory').value.trim(),
            price: parseFloat(document.getElementById('adminPrice').value),
            image: document.getElementById('adminImage').value.trim(),
            full_link: document.getElementById('adminLink').value.trim()
        };

        const isEditing = id && id !== "undefined" && id.length > 0;
        const url = isEditing ? `${API_URL}/books/${id}` : `${API_URL}/books`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
            
            const result = await res.json();
            if (result.success || result.data) {
                alert(isEditing ? "¡Libro actualizado!" : "¡Libro publicado!");
                resetAdminForm();
                await loadCatalog(); 
            } else {
                alert("Error: " + (result.message || "No se pudo guardar"));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión al servidor.");
        }
    });

    // Botón borrar todo
    document.getElementById('clearAllBooksBtn').addEventListener('click', async () => {
        if (confirm('⚠️ ¿BORRAR TODOS LOS LIBROS?')) {
            try {
                await fetch(`${API_URL}/admin/books/clear-all`, { method: 'DELETE' });
                loadCatalog();
            } catch (err) { alert("Error al borrar."); }
        }
    });
});

// Función para cargar catálogo
async function loadCatalog() {
    try {
        const res = await fetch(`${API_URL}/books`);
        allBooksLocal = await res.json();
        renderInventoryTable(allBooksLocal);
    } catch (err) { console.error(err); }
}

// Función para renderizar tabla
function renderInventoryTable(booksList) {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    booksList.forEach(book => {
        const idToUse = book._id || book.id;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${book.image}" style="width:30px;"></td>
            <td>${book.title}</td>
            <td>${book.category}</td>
            <td>Q${parseFloat(book.price).toFixed(2)}</td>
            <td>
                <button onclick="startEditBook('${idToUse}')">Edit</button>
                <button onclick="deleteBook('${idToUse}')">Del</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Función para preparar edición
function startEditBook(id) {
    const book = allBooksLocal.find(b => (b._id === id || b.id == id));
    if (!book) { alert("Error: Libro no encontrado"); return; }
    
    document.getElementById('formActionTitle').textContent = "Modificar Libro";
    document.getElementById('btnAdminSubmit').textContent = "Guardar Cambios";
    
    // Asignar valores
    document.getElementById('adminBookId').value = book._id || book.id;
    document.getElementById('adminTitle').value = book.title;
    document.getElementById('adminAuthor').value = book.author;
    document.getElementById('adminCategory').value = book.category;
    document.getElementById('adminPrice').value = book.price;
    document.getElementById('adminImage').value = book.image;
    document.getElementById('adminLink').value = book.full_link;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Función para eliminar
async function deleteBook(id) {
    if (confirm('¿Eliminar este libro?')) {
        try {
            await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
            loadCatalog();
        } catch (err) { alert("Error al borrar."); }
    }
}

// Limpiar formulario
function resetAdminForm() {
    document.getElementById('adminBookForm').reset();
    document.getElementById('adminBookId').value = '';
    document.getElementById('formActionTitle').textContent = "Añadir Nuevo Libro";
    document.getElementById('btnAdminSubmit').textContent = "Publicar Libro";
}
