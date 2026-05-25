const API_URL = window.location.origin;
let allBooksLocal = [];

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

  // FORMULARIO DE LOGIN
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

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
      localStorage.setItem('userName', data.name);
      checkSession();
    } else {
      alert(data.message);
    }
  });

  // FORMULARIO DE REGISTRO
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      alert('¡Cuenta creada! Inicia sesión.');
      document.getElementById('register-box').classList.add('hidden');
      document.getElementById('login-box').classList.remove('hidden');
    }
  });

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

  // ENVIAR NUEVO LIBRO (ADMIN)
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
});

function checkSession() {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');

  if (userId) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    // Mapeo del saludo solicitado (Nombre en vez de Correo)
    document.getElementById('userGreeting').textContent = userRole === 'admin' ? userEmail : (userName || userEmail);

    if (userRole === 'admin') {
      document.getElementById('admin-view').classList.remove('hidden');
      document.getElementById('customer-view').classList.add('hidden');
      loadAdminSales();
    } else {
      document.getElementById('admin-view').classList.add('hidden');
      document.getElementById('customer-view').classList.remove('hidden');
    }
    loadCatalog();
  }
}

async function loadCatalog() {
  const res = await fetch(`${API_URL}/books`);
  allBooksLocal = await res.json();
  renderBooks(allBooksLocal);
}

function renderBooks(booksList) {
  const container = document.getElementById('booksContainer');
  container.innerHTML = '';
  
  const activeCategory = document.querySelector('.btn-category.active').getAttribute('data-category');

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
        <div class="admin-actions">
          <button onclick="deleteBook(${book.id})">Eliminar</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function filterBooks(search) {
  const filtered = allBooksLocal.filter(b => b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search));
  renderBooks(filtered);
}

async function deleteBook(id) {
  if (confirm('¿Eliminar este libro?')) {
    await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    loadCatalog();
  }
}

async function loadAdminSales() {
  const res = await fetch(`${API_URL}/admin/sales`);
  const sales = await res.json();
  const tbody = document.getElementById('salesLogTableBody');
  tbody.innerHTML = '';
  sales.forEach(sale => {
    tbody.innerHTML += `
      <tr>
        <td><strong>#${sale.id}</strong></td>
        <td>${sale.user_email}</td>
        <td>${sale.date || 'Reciente'}</td>
        <td style="color:var(--accent-cyan); font-weight:bold;">Q${sale.total.toFixed(2)}</td>
        <td><span class="status-badge">Pagado</span></td>
      </tr>
    `;
  });
}
