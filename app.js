// Dirección del Backend en Render
const API_URL = "https://bookstore-neo.onrender.com"; 
let allBooksLocal = [];
let isEditing = false; // Estado para saber si estamos editando

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Transiciones de paneles (Login / Registro)
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

  // Buscador de texto en tiempo real
  document.getElementById('bookSearchInput').addEventListener('input', (e) => {
    filterBooks(e.target.value.toLowerCase().trim());
  });

  // BOTÓN DE VACIAR CAMPOS DEL FORMULARIO (Evita borrar a mano URLs gigantes)
  document.getElementById('btnClearFormFields').addEventListener('click', () => {
    resetAdminForm();
  });

  // FORMULARIO DE INICIO DE SESIÓN
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
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error en login:", error);
      alert("No se pudo conectar con el servidor de Render.");
    }
  });

  // FORMULARIO DE REGISTRO
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
        alert('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
        document.getElementById('register-box').classList.add('hidden');
        document.getElementById('login-box').classList.remove('hidden');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      alert("Error al registrar la cuenta.");
    }
  });

  // CERRAR SESIÓN
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  // FILTRADO DE CATEGORÍAS
  const categoryButtons = document.querySelectorAll('.btn-category');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterBooks(document.getElementById('bookSearchInput').value.toLowerCase().trim());
    });
  });

  // GUARDAR NUEVO LIBRO O ACTUALIZAR EXISTENTE (PANEL ADMIN)
  document.getElementById('adminBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('adminBookId').value;
    const title = document.getElementById('adminTitle').value.trim();
    const author = document.getElementById('adminAuthor').value.trim();
    const category = document.getElementById('adminCategory').value.trim();
    const price = parseFloat(document.getElementById('adminPrice').value);
    const image = document.getElementById('adminImage').value.trim();
    const full_link = document.getElementById('adminLink').value.trim();

    // Si estamos editando, usamos PUT a /books/:id; de lo contrario POST a /books
    const url = isEditing ? `${API_URL}/books/${id}` : `${API_URL}/books`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, category, price, image, full_link })
      });
      const data = await res.json();
      if (data.success) {
        alert(isEditing ? "¡Libro actualizado correctamente!" : "¡Libro publicado correctamente!");
        resetAdminForm();
        setTimeout(() => { loadCatalog(); }, 500);
      }
    } catch (err) {
      console.error("Error al procesar libro:", err);
    }
  });

  // BORRAR TODO EL INVENTARIO DE LIBROS
  document.getElementById('clearAllBooksBtn').addEventListener('click', async () => {
    if (confirm('⚠️ ¡ADVERTENCIA CRÍTICA!\n¿Deseas eliminar ABSOLUTAMENTE TODOS los libros del catálogo de forma permanente?')) {
      try {
        await fetch(`${API_URL}/admin/books/clear-all`, { method: 'DELETE' });
        loadCatalog();
      } catch (error) {
        console.error("Error al vaciar catálogo:", error);
      }
    }
  });

  // VACIAR HISTORIAL DE VENTAS
  document.getElementById('clearSalesBtn').addEventListener('click', async () => {
    if(confirm('¿Deseas eliminar por completo el historial de ventas globales?')) {
      await fetch(`${API_URL}/admin/sales`, { method: 'DELETE' });
      loadAdminSales();
    }
  });
});

// CONTROLADOR DE SESIONES DE USUARIO
function checkSession() {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  if (userId) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('header-controls').classList.remove('hidden');
    
    document.getElementById('userGreeting').textContent = userRole === 'admin' ? userEmail : userName;

    if (userRole === 'admin') {
      document.getElementById('admin-view').classList.remove('hidden');
      document.getElementById('customer-view').classList.add('hidden');
      
      const clientElements = document.querySelectorAll('.customer-only');
      clientElements.forEach(el => el.classList.add('hidden'));
      
      loadCatalog();
      loadAdminSales();
    } else {
      document.getElementById('admin-view').classList.add('hidden');
      document.getElementById('customer-view').classList.remove('hidden');
      loadCatalog(); 
      updateCartCount();
    }
  } else {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('header-controls').classList.add('hidden');
  }
}

// CARGAR CATÁLOGO GENERAL
async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    allBooksLocal = await res.json();
    renderBooks(allBooksLocal);
    renderInventoryTable(allBooksLocal);
  } catch (err) {
    console.error("Error cargando catálogo:", err);
  }
}

// RENDERIZAR LAS TARJETAS DE LOS LIBROS (CLIENTE)
function renderBooks(booksList) {
  const container = document.getElementById('booksContainer');
  if(!container) return;
  container.innerHTML = '';
  
  const activeCategory = document.querySelector('.btn-category.active').getAttribute('data-category');
  const userRole = localStorage.getItem('userRole');

  booksList.forEach(book => {
    if (activeCategory !== 'Todos' && book.category !== activeCategory) return;

    const card = document.createElement('div');
    card.classList.add('book-card');
    card.innerHTML = `
      <div>
        <img src="${book.image || 'https://via.placeholder.com/150'}" alt="${book.title}">
        <div class="book-title">${book.title}</div>
        <div class="book-author">Por ${book.author}</div>
      </div>
      <div>
        <div class="book-price">Q${parseFloat(book.price).toFixed(2)}</div>
        <button class="btn-action" onclick="viewBook('${book.full_link}')">Ver Libro Completo 🔒</button>
        ${userRole === 'admin' ? '' : `
          <button class="btn-action btn-add-cart" onclick="addToCart(${book.id})">🛒 Añadir al Carrito</button>
        `}
      </div>
    `;
    container.appendChild(card);
  });
}

// MOSTRAR LA TABLA DEL INVENTARIO (ADMINISTRADOR CON BOTONES EDITAR Y ELIMINAR)
function renderInventoryTable(booksList) {
  const tableBody = document.getElementById('inventoryTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  booksList.forEach(book => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${book.image || 'https://via.placeholder.com/150'}" alt="Portada" style="width: 40px; height: 55px; object-fit: cover; border-radius: 4px;"></td>
      <td>
        <strong>${book.title}</strong><br>
        <span style="color: var(--text-muted); font-size: 0.8rem;">Por ${book.author}</span>
      </td>
      <td><span class="status-badge">${book.category}</span></td>
      <td><strong>Q${parseFloat(book.price).toFixed(2)}</strong></td>
      <td>
        <div class="admin-actions-cell" style="display: flex; gap: 5px;">
          <button class="btn-table-edit" style="background-color: #ffc107; color: black; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;" onclick="startEditBook(${book.id})"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-table-delete" onclick="deleteBook(${book.id})"><i class="fas fa-trash"></i> Eliminar</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// PREPARAR FORMULARIO PARA EDITAR
function startEditBook(id) {
  const book = allBooksLocal.find(b => b.id === id);
  if (!book) return;

  isEditing = true;
  document.getElementById('formActionTitle').textContent = "Modificar Libro Seleccionado";
  document.getElementById('btnAdminSubmit').textContent = "Guardar Cambios";
  document.getElementById('btnAdminSubmit').style.backgroundColor = "#ffc107";
  document.getElementById('btnAdminSubmit').style.color = "black";

  // Cargar datos actuales en los inputs
  document.getElementById('adminBookId').value = book.id;
  document.getElementById('adminTitle').value = book.title;
  document.getElementById('adminAuthor').value = book.author;
  document.getElementById('adminCategory').value = book.category;
  document.getElementById('adminPrice').value = book.price;
  document.getElementById('adminImage').value = book.image;
  document.getElementById('adminLink').value = book.full_link;
  
  // Hacer scroll automático hacia el formulario para editar con comodidad
  document.getElementById('adminBookForm').scrollIntoView({ behavior: 'smooth' });
}

// REINICIAR EL FORMULARIO A SU ESTADO ORIGINAL
function resetAdminForm() {
  isEditing = false;
  document.getElementById('adminBookForm').reset();
  document.getElementById('adminBookId').value = '';
  document.getElementById('formActionTitle').textContent = "Añadir Nuevo Libro";
  document.getElementById('btnAdminSubmit').textContent = "Publicar Libro";
  document.getElementById('btnAdminSubmit').style.backgroundColor = ""; 
  document.getElementById('btnAdminSubmit').style.color = "";
}

function filterBooks(search) {
  const filtered = allBooksLocal.filter(b => b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search));
  renderBooks(filtered);
}

async function addToCart(bookId) {
  const userId = localStorage.getItem('userId');
  await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, book_id: bookId })
  });
  updateCartCount();
}

async function updateCartCount() {
  const userId = localStorage.getItem('userId');
  if(!userId) return;
  try {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const cartItems = await res.json();
    document.getElementById('cartCount').textContent = cartItems.length;
  } catch (error) {
    console.error("Error al actualizar carrito:", error);
  }
}

function viewBook(link) {
  if(link && link !== 'undefined') {
    window.open(link, '_blank');
  } else {
    alert("Enlace no disponible.");
  }
}

// ELIMINAR LIBRO INDIVIDUAL
async function deleteBook(id) {
  if (confirm('¿Eliminar este libro de manera permanente del catálogo e inventario?')) {
    await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    loadCatalog();
  }
}

// HISTORIAL DE VENTAS (ADMIN)
async function loadAdminSales() {
  try {
    const res = await fetch(`${API_URL}/admin/sales`);
    const sales = await res.json();
    const tbody = document.getElementById('salesLogTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    sales.forEach(sale => {
      tbody.innerHTML += `
        <tr>
          <td><strong>#${sale.id}</strong></td>
          <td>${sale.user_email}</td>
          <td>${sale.date || 'Reciente'}</td>
          <td style="color:#00f5d4; font-weight:bold;">Q${sale.total.toFixed(2)}</td>
          <td><span class="status-badge">Pagado</span></td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error al leer ventas:", error);
  }
}
