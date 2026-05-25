const API_URL = "https://bookstore-neo.onrender.com";
let allBooksLocal = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCatalog();

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

        // Lógica: Si hay ID, es PUT (Editar), si no, es POST (Crear)
        const isEditing = id && id !== "undefined" && id !== "";
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
                alert(isEditing ? "¡Libro actualizado!" : "¡Libro creado!");
                resetAdminForm();
                // Actualización obligatoria de la interfaz
                await loadCatalog(); 
            } else {
                alert("Error: " + (result.message || "No se guardaron los cambios"));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión con el servidor.");
        }
    });
});

async function loadCatalog() {
    try {
        const res = await fetch(`${API_URL}/books`, { cache: 'no-cache' });
        allBooksLocal = await res.json();
        renderInventoryTable(allBooksLocal);
    } catch (err) { console.error("Error al cargar catálogo:", err); }
}

function startEditBook(id) {
    const book = allBooksLocal.find(b => (b._id === id || b.id === id));
    if (!book) return;
    
    // Cargar ID al campo oculto
    document.getElementById('adminBookId').value = book._id || book.id;
    
    document.getElementById('adminTitle').value = book.title;
    document.getElementById('adminAuthor').value = book.author;
    document.getElementById('adminCategory').value = book.category;
    document.getElementById('adminPrice').value = book.price;
    document.getElementById('adminImage').value = book.image;
    document.getElementById('adminLink').value = book.full_link;
    
    document.getElementById('formActionTitle').textContent = "Modificar Libro";
    document.getElementById('btnAdminSubmit').textContent = "Guardar Cambios";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderInventoryTable(books) {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    books.forEach(book => {
        const id = book._id || book.id;
        tableBody.innerHTML += `
            <tr>
                <td><img src="${book.image}" style="width:30px;"></td>
                <td>${book.title}</td>
                <td>${book.category}</td>
                <td>Q${parseFloat(book.price).toFixed(2)}</td>
                <td>
                    <button onclick="startEditBook('${id}')">Edit</button>
                    <button onclick="deleteBook('${id}')">Del</button>
                </td>
            </tr>`;
    });
}

function resetAdminForm() {
    document.getElementById('adminBookForm').reset();
    document.getElementById('adminBookId').value = '';
    document.getElementById('formActionTitle').textContent = "Añadir Nuevo Libro";
    document.getElementById('btnAdminSubmit').textContent = "Publicar Libro";
}

async function deleteBook(id) {
    if (confirm('¿Eliminar este libro?')) {
        await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
        await loadCatalog();
    }
}
