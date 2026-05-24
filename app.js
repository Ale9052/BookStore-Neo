const API_URL = window.location.origin;
let allBooksLocal = [];
let purchasedBooksLocal = [];

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Cambio seguro entre cajas de autenticación
  const showRegister = document.getElementById('showRegister');
  if (showRegister) {
    showRegister.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-box').classList.add('hidden');
      document.getElementById('register-box').classList.remove('hidden');
    });
  }

  const showLogin = document.getElementById('showLogin');
  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('register-box').classList.add('hidden');
      document.getElementById('login-box').classList.remove('hidden');
    });
  }

  // Visibilidad de contraseñas
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const passwordInput = document.getElementById(targetId);
      if (passwordInput) {
        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        button.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
      }
    });
  });

  // Buscador de libros alternativo seguro
  const bookSearchInput = document.getElementById('bookSearchInput');
  if (bookSearchInput) {
    bookSearchInput.addEventListener('input', (e) => {
      filterBooks(e.target.value.toLowerCase().trim());
    });
  }

  const btnCancelEdit = document.getElementById('btnCancelEdit');
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      cancelBookEdit();
    });
  }

  // EVENTO DE LOGIN
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
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
          localStorage.setItem('userName', data.name);
          checkSession();
        } else {
          alert(data.message || 'Credenciales incorrectas.');
        }
      } catch (err) {
        console.error(err);
        alert('Error conectando al servidor.');
      }
    });
  }

  // EVENTO DE REGISTRO
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
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
          alert('¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.');
          document.getElementById('register-box').classList.add('hidden');
          document.getElementById('login-box').classList.remove('hidden');
          registerForm.reset();
        } else {
          alert(data.message || 'Error al registrar.');
        }
      } catch (err) {
        console.error(err);
        alert('Error en el servidor al registrar.');
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.reload();
    });
  }

  const viewCartBtn = document.getElementById('viewCartBtn');
  if (viewCartBtn) {
    viewCartBtn.addEventListener('click', () => {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.remove('hidden');
      loadCart();
    });
  }

  const closeCartBtn = document.getElementById('closeCartBtn');
  if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
      const modal = document.getElementById('cart-modal');
      if (modal) modal.classList.add('hidden');
    });
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      if (!userId) return;

      try {
        const resCart = await fetch(`${API_URL}/cart/${userId}`);
        const cartItems = await resCart.json();
        if (cartItems.length === 0) {
          alert('El carrito está vacío.');
          return;
        }

        let total = 0;
        const items = cartItems.map(item => {
          total += item.price * item.quantity;
          return { title: item.title, quantity: item.quantity };
        });

        const resOrder = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, userEmail, total, items })
        });
        const orderData = await resOrder.json();

        if (orderData.success) {
          alert('🎉 ¡Compra procesada con éxito!');
          const modal = document.getElementById('cart-modal');
          if (modal) modal.classList.add('hidden');
          updateCartBadge();
          loadPurchasedBooks();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  const categoryButtons = document.querySelectorAll('.btn-category');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const searchInput = document.getElementById('bookSearchInput');
      if (searchInput) searchInput.value = '';
      filterBooks('');
    });
  });

  const adminBookForm = document.getElementById('adminBookForm');
  if (adminBookForm) {
    adminBookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bookId = document.getElementById('adminBookId').value;
      const title = document.getElementById('adminTitle').value.trim();
      const author = document.getElementById('adminAuthor').value.trim();
      const category = document.getElementById('adminCategory').value;
      const price = parseFloat(document.getElementById('adminPrice').value);
      const image = document.getElementById('adminImage').value.trim();
      const full_link = document.getElementById('adminLink').value.trim();
      const badge = document.getElementById('adminBadge').value;

      const bookData = { title, author, category, price, image, full_link, badge };

      try {
        let res = bookId 
          ? await fetch(`${API_URL}/books/${bookId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookData) })
          : await fetch(`${API_URL}/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookData) });

        const data = await res.json();
        if (data.success) {
          alert('Libro guardado con éxito.');
          cancelBookEdit();
          loadCatalog();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  const btnClearSalesLog = document.getElementById('btnClearSalesLog');
  if (btnClearSalesLog) {
    btnClearSalesLog.addEventListener('click', async () => {
      if (!confirm('¿Vaciar por completo el historial?')) return;
      try {
        const res = await fetch(`${API_URL}/admin/sales`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          loadAdminSales();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});

function checkSession() {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName');

  const authSection = document.getElementById('auth-section');
  const appContent = document.getElementById('app-content');
  const logoutBtn = document.getElementById('logoutBtn');
  const searchWrapper = document.getElementById('search-wrapper');
  const greeting = document.getElementById('userGreeting');
  const adminSection = document.getElementById('admin-section');
  const viewCartBtn = document.getElementById('viewCartBtn');

  if (userId) {
    if (authSection) authSection.classList.add('hidden');
    if (appContent) appContent.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (searchWrapper) searchWrapper.classList.remove('hidden');

    if (greeting) {
      // Usar el nombre guardado en vez del correo electrónico
      greeting.textContent = `Hola, ${userName || 'Usuario'}`;
      greeting.classList.remove('hidden');
    }

    if (userRole === 'admin') {
      if (adminSection) adminSection.classList.remove('hidden');
      if (viewCartBtn) viewCartBtn.classList.add('hidden');
      loadAdminSales();
    } else {
      if (adminSection) adminSection.classList.add('hidden');
      if (viewCartBtn) viewCartBtn.classList.remove('hidden');
      updateCartBadge();
      loadPurchasedBooks();
    }
    loadCatalog();
  } else {
    if (authSection) authSection.classList.remove('hidden');
    if (appContent) appContent.add ? appContent.classList.add('hidden') : appContent.setAttribute('class', 'hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (greeting) greeting.classList.add('hidden');
    if (viewCartBtn) viewCartBtn.classList.add('hidden');
    if (adminSection) adminSection.classList.add('hidden');
    if (searchWrapper) searchWrapper.classList.add('hidden');
  }
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    allBooksLocal = await res.json();
    renderBooks(allBooksLocal);
  } catch (err) {
    console.error(err);
  }
}

async function loadPurchasedBooks() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const res = await fetch(`${API_URL}/users/${userId}/purchased`);
    purchasedBooksLocal = await res.json();
    renderBooks(allBooksLocal);
  } catch (err) {
    console.error(err);
  }
}

function renderBooks(booksList) {
  const container = document.getElementById('booksContainer');
  if (!container) return;
  container.innerHTML = '';
  const userRole = localStorage.getItem('userRole');

  const noResults = document.getElementById('noResultsMessage');
  if (booksList.length === 0) {
    if (noResults) noResults.classList.remove('hidden');
    return;
  } else {
    if (noResults) noResults.classList.add('hidden');
  }

  booksList.forEach(book => {
    const card = document.createElement('div');
    card.classList.add('book-card', 'glass');

    let badgeHTML = '';
    if (book.badge && book.badge !== 'Ninguno') {
      let badgeClass = book.badge === 'Tendencia' ? 'badge-pink' : (book.badge === 'Premium' ? 'badge-green' : 'badge-cyan');
      badgeHTML = `<span class="book-badge ${badgeClass}">${book.badge}</span>`;
    }

    const isPurchased = purchasedBooksLocal.includes(book.title);
    let actionButtonHTML = userRole === 'admin' 
      ? `<div class="admin-card-actions">
          <button class="btn-card-edit" onclick="editBook(${book.id})">📝 Editar</button>
          <button class="btn-card-delete" onclick="deleteBook(${book.id})">🗑️ Borrar</button>
         </div>`
      : (isPurchased 
          ? `<a href="${book.full_link || '#'}" target="_blank" class="btn-card btn-read">📖 Leer Libro Digital</a>`
          : `<button class="btn-card" onclick="addToCart(${book.id})">🛒 Añadir al Carrito</button>`);

    card.innerHTML = `
      <div class="book-cover-wrapper">
        <img src="${book.image || 'https://via.placeholder.com/150x220'}" alt="${book.title}" class="book-cover">
        ${badgeHTML}
      </div>
      <div class="book-info">
        <span class="book-category-tag">${book.category}</span>
        <h3 class="book-title-h3">${book.title}</h3>
        <p class="book-author-p">Por: ${book.author}</p>
        <div class="book-footer-row">
          <span class="book-price">Q${book.price.toFixed(2)}</span>
          ${userRole !== 'admin' && isPurchased ? '<span class="owned-indicator">✔ Adquirido</span>' : ''}
        </div>
        ${actionButtonHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

function filterBooks(searchTerm) {
  const activeCategoryButton = document.querySelector('.btn-category.active');
  const activeCategory = activeCategoryButton ? activeCategoryButton.getAttribute('data-category') : 'Todos';

  const filtered = allBooksLocal.filter(book => {
    const matchesCategory = (activeCategory === 'Todos' || book.category === activeCategory);
    const matchesSearch = (book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  renderBooks(filtered);
}

async function addToCart(bookId) {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const res = await fetch(`${API_URL}/cart`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, book_id: bookId }) });
    const data = await res.json();
    if (data.success) {
      updateCartBadge();
      alert('Libro añadido al carrito.');
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateCartBadge() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const items = await res.json();
    let totalCount = 0;
    items.forEach(i => totalCount += i.quantity);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = totalCount;
  } catch (err) {
    console.error(err);
  }
}

async function loadCart() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  try {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const items = await res.json();
    const tbody = document.getElementById('cartTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let totalSum = 0;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:30px;">Tu carrito está vacío 🛒</td></tr>`;
      const totElem = document.getElementById('cartTotalElement');
      if (totElem) totElem.textContent = 'Q0.00';
      return;
    }

    items.forEach(item => {
      const subtotal = item.price * item.quantity;
      totalSum += subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.title}</strong><br><span style="font-size:12px; color:var(--text-muted);">Q${item.price.toFixed(2)}</span></td>
        <td><button onclick="changeQty(${item.cartItemId}, ${item.quantity - 1})">-</button> <span>${item.quantity}</span> <button onclick="changeQty(${item.cartItemId}, ${item.quantity + 1})">+</button></td>
        <td style="color:var(--neon-green);">Q${subtotal.toFixed(2)}</td>
        <td><button onclick="removeCartItem(${item.cartItemId})">❌</button></td>
      `;
      tbody.appendChild(tr);
    });
    const totElem = document.getElementById('cartTotalElement');
    if (totElem) totElem.textContent = `Q${totalSum.toFixed(2)}`;
  } catch (err) {
    console.error(err);
  }
}

async function changeQty(cartItemId, newQty) {
  if (newQty <= 0) return removeCartItem(cartItemId);
  try {
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty }) });
    const data = await res.json();
    if (data.success) { loadCart(); updateCartBadge(); }
  } catch (err) { console.error(err); }
}

async function removeCartItem(cartItemId) {
  try {
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { loadCart(); updateCartBadge(); }
  } catch (err) { console.error(err); }
}

function editBook(id) {
  const book = allBooksLocal.find(b => b.id === id);
  if (!book) return;
  document.getElementById('adminBookId').value = book.id;
  document.getElementById('adminTitle').value = book.title;
  document.getElementById('adminAuthor').value = book.author;
  document.getElementById('adminCategory').value = book.category;
  document.getElementById('adminPrice').value = book.price;
  document.getElementById('adminImage').value = book.image;
  document.getElementById('adminLink').value = book.full_link;
  document.getElementById('adminBadge').value = book.badge || 'Ninguno';

  document.getElementById('formTitleHeader').textContent = '📝 Editar Libro';
  document.getElementById('btnSubmitBook').textContent = 'Guardar Cambios';
  document.getElementById('btnCancelEdit').classList.remove('hidden');
}

function cancelBookEdit() {
  document.getElementById('adminBookId').value = '';
  document.getElementById('adminBookForm').reset();
  document.getElementById('formTitleHeader').textContent = '➕ Agregar Nuevo Libro';
  document.getElementById('btnSubmitBook').textContent = 'Publicar Libro';
  document.getElementById('btnCancelEdit').classList.add('hidden');
}

async function deleteBook(id) {
  if (!confirm('¿Eliminar libro?')) return;
  try {
    const res = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) loadCatalog();
  } catch (err) { console.error(err); }
}

async function loadAdminSales() {
  try {
    const res = await fetch(`${API_URL}/admin/sales`);
    const sales = await res.json();
    renderAdminSales(sales);
  } catch (err) { console.error(err); }
}

function renderAdminSales(salesList) {
  const tbody = document.getElementById('salesLogTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (salesList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay transacciones.</td></tr>`;
    return;
  }
  salesList.forEach(sale => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${sale.id}</strong></td>
      <td>${sale.user_email}</td>
      <td>${sale.date}</td>
      <td style="color:var(--neon-cyan);">Q${sale.total.toFixed(2)}</td>
      <td><span>${sale.status}</span></td>
      <td><button onclick="deleteSingleSale(${sale.id})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteSingleSale(orderId) {
  if (!confirm(`¿Eliminar venta #${orderId}?`)) return;
  try {
    const res = await fetch(`${API_URL}/admin/sales/${orderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) loadAdminSales();
  } catch (err) { console.error(err); }
}
