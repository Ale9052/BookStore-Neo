// Enlace absoluto a tu servidor estable en Render
const API_URL = "https://bookstore-neo.onrender.com"; 
let allBooksLocal = [];

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Transiciones del panel de Autenticación
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

  // Buscador dinámico por texto
  document.getElementById('bookSearchInput').addEventListener('input', (e) => {
    filterBooks(e.target.value.toLowerCase().trim());
  });

  // LOGIC DE INICIO DE SESIÓN
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

  // LOGIC DE REGISTRO DE USUARIOS
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

  // FILTRADO POR CATEGORÍAS
  const categoryButtons = document.querySelectorAll('.btn-category');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterBooks(document.getElementById('bookSearchInput').value.toLowerCase().trim());
    });
  });

  // INSERTAR LIBROS DESDE PANEL ADMIN
  document.getElementById('adminBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('adminTitle').value.trim();
    const author = document.getElementById('adminAuthor').value.trim();
    const category = document.getElementById('adminCategory').value.trim();
    const price = parseFloat(document.getElementById('adminPrice').value);
    const image = document.getElementById('adminImage').value.trim();
    const full_link = document.getElementById('adminLink').value.trim();

    const res = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, category, price, image, full_link })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('adminBookForm').reset();
      loadCatalog();
    }
  });

  // LIMPIAR VENTAS (ADMIN)
  document.getElementById('clearSalesBtn').addEventListener('click', async () => {
    if(confirm('¿Deseas vaciar por completo el historial de ventas?')) {
      await fetch(`${API_URL}/admin/sales`, { method: 'DELETE' });
      loadAdminSales();
    }
  });
});

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
      
      // Esconder elementos de cliente si eres admin
      const clientElements = document.querySelectorAll('.customer-only');
      clientElements.forEach(el => el.classList.add('hidden'));
      
      loadAdminSales();
    } else {
      document.getElementById('admin-view').classList.add('hidden');
      document.getElementById('customer-view').classList.remove('hidden');
      updateCartCount();
    }
    loadCatalog();
  } else {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('header-controls').classList.add('hidden');
  }
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    allBooksLocal = await res.json();
    renderBooks(allBooksLocal);
  } catch (err) {
    console.error("Error cargando catálogo:", err);
  }
}

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
        <div class="book-price">Q${book.price.toFixed(2)}</div>
        <button class="btn-action" onclick="viewBook('${book.full_link}')">Ver Libro Completo 🔒</button>
        ${userRole === 'admin' ? `
          <div class="admin-actions">
            <button class="btn-delete-book" onclick="deleteBook(${book.id})">Eliminar</button>
          </div>
        ` : `
          <button class="btn-action btn-add-cart" onclick="addToCart(${book.id})">🛒 Añadir al Carrito</button>
        `}
      </div>
    `;
    container.appendChild(card);
  });
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

async function deleteBook(id) {
  if (confirm('¿Eliminar este libro de manera permanente?')) {
    await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    loadCatalog();
  }
}

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
