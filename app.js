const API_URL = "https://bookstore-neo.onrender.com"; 
let allBooksLocal = [];
let userPaidBookIds = []; 
let isEditing = false; 
let selectedBookForModal = null; 

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.remove('hidden');
  });

  document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
  });

  document.getElementById('bookSearchInput').addEventListener('input', (e) => {
    filterBooks(e.target.value.toLowerCase().trim());
  });

  document.getElementById('modalAddToCartBtn').addEventListener('click', async () => {
    if (selectedBookForModal) {
      await addToCart(selectedBookForModal.id || selectedBookForModal._id);
      document.getElementById('purchaseModal').style.display = 'none';
      abrirVistaCarrito();
    }
  });

  // [LOGIN Y REGISTRO SE MANTIENEN IGUAL...]
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userName', data.name || email);
        checkSession();
      } else { alert(data.message); }
    } catch (error) { alert("No se pudo conectar con el servidor."); }
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Cuenta creada con éxito!');
        document.getElementById('register-box').classList.add('hidden');
        document.getElementById('login-box').classList.remove('hidden');
      } else { alert(data.message); }
    } catch (error) { console.error(error); }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  const categoryButtons = document.querySelectorAll('.btn-category');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      regresarAlCatalogo();
      filterBooks(document.getElementById('bookSearchInput').value.toLowerCase().trim());
    });
  });

  document.getElementById('adminBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('adminBookId').value;
    const title = document.getElementById('adminTitle').value.trim();
    const author = document.getElementById('adminAuthor').value.trim();
    const category = document.getElementById('adminCategory').value.trim();
    const price = parseFloat(document.getElementById('adminPrice').value);
    const image = document.getElementById('adminImage').value.trim();
    const full_link = document.getElementById('adminLink').value.trim();

    const url = isEditing ? `${API_URL}/books/${id}` : `${API_URL}/books`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, category, price, image, full_link })
      });
      const data = await res.json();
      if (data.success || data.message) {
        alert(isEditing ? "¡Libro actualizado!" : "¡Libro publicado!");
        resetAdminForm();
        await loadCatalog(); 
      } else { alert("Error al guardar en base de datos."); }
    } catch (err) { alert("Error de conexión al guardar."); }
  });

  document.getElementById('clearAllBooksBtn').addEventListener('click', async () => {
    if (confirm('⚠️ ¿Borrar todos los libros?')) {
      try {
        await fetch(`${API_URL}/admin/books/clear-all`, { method: 'DELETE' });
        loadCatalog();
      } catch (err) { alert("Error al borrar todo."); }
    }
  });
});

// --- FUNCIONES CORREGIDAS PARA MANEJAR IDs ---

function renderInventoryTable(booksList) {
  const tableBody = document.getElementById('inventoryTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  booksList.forEach(book => {
    // ESTA ES LA CORRECCIÓN: usamos _id si existe, si no, id
    const bookId = book._id || book.id; 
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${book.image}" style="width:30px;"></td>
      <td>${book.title}</td>
      <td>${book.category}</td>
      <td>Q${parseFloat(book.price).toFixed(2)}</td>
      <td>
        <button onclick="startEditBook('${bookId}')">Edit</button>
        <button onclick="deleteBook('${bookId}')">Del</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function startEditBook(id) {
  const book = allBooksLocal.find(b => (b._id === id || b.id == id));
  isEditing = true;
  document.getElementById('formActionTitle').textContent = "Modificar Libro";
  document.getElementById('btnAdminSubmit').textContent = "Guardar Cambios";
  document.getElementById('adminBookId').value = book._id || book.id;
  document.getElementById('adminTitle').value = book.title;
  document.getElementById('adminAuthor').value = book.author;
  document.getElementById('adminCategory').value = book.category;
  document.getElementById('adminPrice').value = book.price;
  document.getElementById('adminImage').value = book.image;
  document.getElementById('adminLink').value = book.full_link;
  document.getElementById('adminBookForm').scrollIntoView({ behavior: 'smooth' });
}

async function deleteBook(id) {
  if (!id || id === 'undefined') { alert("Error: ID no encontrado"); return; }
  if (confirm('¿Eliminar libro?')) {
    try {
      await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
      loadCatalog();
    } catch (err) { alert("Error al borrar."); }
  }
}

// [MANTÉN EL RESTO DE FUNCIONES QUE NO CAMBIAN ABAJO]
function togglePasswordVisibility(inputId, buttonElement) {
  const input = document.getElementById(inputId);
  const icon = buttonElement.querySelector('i');
  if (input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { input.type = 'password'; icon.className = 'fas fa-eye'; }
}

function abrirVistaCarrito() {
  document.getElementById('customer-view').classList.add('hidden');
  document.getElementById('cart-view').classList.remove('hidden');
  renderizarVistaCarritoCompleta();
}

function regresarAlCatalogo() {
  document.getElementById('cart-view').classList.add('hidden');
  document.getElementById('customer-view').classList.remove('hidden');
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    allBooksLocal = await res.json();
    renderBooks(allBooksLocal);
    renderInventoryTable(allBooksLocal);
  } catch (err) { console.error(err); }
}

// ... Resto de tus funciones existentes (renderBooks, handleBookAccess, etc.)
