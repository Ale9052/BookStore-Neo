const API_URL = "https://bookstore-neo.onrender.com";
let allBooksLocal = [];
let purchasedBooksLocal = [];

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

  const togglePasswordButtons = document.querySelectorAll('.toggle-password');
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const passwordInput = document.getElementById(targetId);
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      button.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
    });
  });

  document.getElementById('bookSearchInput').addEventListener('input', (e) => {
    filterBooks(e.target.value.toLowerCase().trim());
  });

  document.getElementById('btnCancelEdit').addEventListener('click', () => {
    cancelBookEdit();
  });

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
        checkSession();
      } else {
        alert(data.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor al intentar loguear.');
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        document.getElementById('register-box').classList.add('hidden');
        document.getElementById('login-box').classList.remove('hidden');
      } else {
        alert(data.message || 'Error al registrar usuario.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor al intentar registrar.');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
  });

  document.getElementById('viewCartBtn').addEventListener('click', () => {
    document.getElementById('cart-modal').classList.remove('hidden');
    loadCart();
  });

  document.getElementById('closeCartBtn').addEventListener('click', () => {
    document.getElementById('cart-modal').classList.add('hidden');
  });

  document.getElementById('checkoutBtn').addEventListener('click', async () => {
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
        alert('🎉 ¡Compra procesada con éxito! Gracias por tu preferencia.');
        document.getElementById('cart-modal').classList.add('hidden');
        updateCartBadge();
        loadPurchasedBooks();
      } else {
        alert('Error al procesar la orden.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el checkout.');
    }
  });

  const categoryButtons = document.querySelectorAll('.btn-category');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('bookSearchInput').value = '';
      filterBooks('');
    });
  });

  document.getElementById('adminBookForm').addEventListener('submit', async (e) => {
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
      let res;
      if (bookId) {
        res = await fetch(`${API_URL}/books/${bookId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      } else {
        res = await fetch(`${API_URL}/books`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      }

      const data = await res.json();
      if (data.success) {
        alert(bookId ? 'Libro actualizado con éxito.' : 'Libro creado con éxito.');
        cancelBookEdit();
        loadCatalog();
      } else {
        alert('Error al guardar el libro.');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor al guardar libro.');
    }
  });

  document.getElementById('btnClearSalesLog').addEventListener('click', async () => {
    if (!confirm('⚠ ¿Estás seguro de que deseas vaciar por completo el historial de ventas? Esta acción es irreversible.')) return;
    try {
      const res = await fetch(`${API_URL}/admin/sales`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Historial de ventas vaciado de manera segura.');
        loadAdminSales();
      }
    } catch (err) {
      console.error(err);
    }
  });
});

function checkSession() {
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

  if (userId) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('search-wrapper').classList.remove('hidden');

    const greeting = document.getElementById('userGreeting');
    greeting.textContent = `Hola, ${userEmail.split('@')[0]}`;
    greeting.classList.remove('hidden');

    if (userRole === 'admin') {
      document.getElementById('admin-section').classList.remove('hidden');
      document.getElementById('viewCartBtn').classList.add('hidden');
      loadAdminSales();
    } else {
      document.getElementById('admin-section').classList.add('hidden');
      document.getElementById('viewCartBtn').classList.remove('hidden');
      updateCartBadge();
      loadPurchasedBooks();
    }

    loadCatalog();
  } else {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('userGreeting').classList.add('hidden');
    document.getElementById('viewCartBtn').classList.add('hidden');
    document.getElementById('admin-section').classList.add('hidden');
    document.getElementById('search-wrapper').classList.add('hidden');
  }
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    const books = await res.json();
    allBooksLocal = books;
    renderBooks(books);
  } catch (err) {
    console.error('Error cargando el catálogo:', err);
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
  container.innerHTML = '';
  const userRole = localStorage.getItem('userRole');

  if (booksList.length === 0) {
    document.getElementById('noResultsMessage').classList.remove('hidden');
    return;
  } else {
    document.getElementById('noResultsMessage').classList.add('hidden');
  }

  booksList.forEach(book => {
    const card = document.createElement('div');
    card.classList.add('book-card', 'glass');

    let badgeHTML = '';
    if (book.badge && book.badge !== 'Ninguno') {
      let badgeClass = 'badge-cyan';
      if (book.badge === 'Tendencia') badgeClass = 'badge-pink';
      if (book.badge === 'Premium') badgeClass = 'badge-green';
      badgeHTML = `<span class="book-badge ${badgeClass}">${book.badge}</span>`;
    }

    const isPurchased = purchasedBooksLocal.includes(book.title);
    let actionButtonHTML = '';

    if (userRole === 'admin') {
      actionButtonHTML = `
        <div class="admin-card-actions">
          <button class="btn-card-edit" onclick="editBook(${book.id})">📝 Editar</button>
          <button class="btn-card-delete" onclick="deleteBook(${book.id})">🗑️ Borrar</button>
        </div>
      `;
    } else {
      if (isPurchased) {
        actionButtonHTML = `<a href="${book.full_link || '#'}" target="_blank" class="btn-card btn-read">📖 Leer Libro Digital</a>`;
      } else {
        actionButtonHTML = `<button class="btn-card" onclick="addToCart(${book.id})">🛒 Añadir al Carrito</button>`;
      }
    }

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
    const res = await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, book_id: bookId })
    });
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
    document.getElementById('cartCount').textContent = totalCount;
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
    tbody.innerHTML = '';

    let totalSum = 0;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:30px;">Tu carrito está vacío 🛒</td></tr>`;
      document.getElementById('cartTotalElement').textContent = 'Q0.00';
      return;
    }

    items.forEach(item => {
      const subtotal = item.price * item.quantity;
      totalSum += subtotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${item.image}" style="width:35px; height:50px; border-radius:4px; object-fit:cover;">
            <div>
              <strong>${item.title}</strong><br>
              <span style="font-size:12px; color:var(--text-muted);">Q${item.price.toFixed(2)} c/u</span>
            </div>
          </div>
        </td>
        <td>
          <div class="cart-qty-controls">
            <button onclick="changeQty(${item.cartItemId}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button onclick="changeQty(${item.cartItemId}, ${item.quantity + 1})">+</button>
          </div>
        </td>
        <td style="color:var(--neon-green); font-weight:700;">Q${subtotal.toFixed(2)}</td>
        <td><button class="btn-remove-item" onclick="removeCartItem(${item.cartItemId})">❌</button></td>
      `;
      tbody.appendChild(tr);
    });

    document.getElementById('cartTotalElement').textContent = `Q${totalSum.toFixed(2)}`;
  } catch (err) {
    console.error(err);
  }
}

async function changeQty(cartItemId, newQty) {
  if (newQty <= 0) {
    removeCartItem(cartItemId);
    return;
  }
  try {
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
    const data = await res.json();
    if (data.success) {
      loadCart();
      updateCartBadge();
    }
  } catch (err) {
    console.error(err);
  }
}

async function removeCartItem(cartItemId) {
  try {
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadCart();
      updateCartBadge();
    }
  } catch (err) {
    console.error(err);
  }
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

  document.getElementById('formTitleHeader').textContent = '📝 Editar Libro Existente';
  document.getElementById('btnSubmitBook').textContent = 'Guardar Cambios';
  document.getElementById('btnCancelEdit').classList.remove('hidden');

  document.getElementById('admin-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelBookEdit() {
  document.getElementById('adminBookId').value = '';
  document.getElementById('adminBookForm').reset();
  document.getElementById('formTitleHeader').textContent = '➕ Agregar Nuevo Libro al Catálogo';
  document.getElementById('btnSubmitBook').textContent = 'Publicar Libro';
  document.getElementById('btnCancelEdit').classList.add('hidden');
}

async function deleteBook(id) {
  if (!confirm('⚠ ¿Seguro que deseas eliminar permanentemente este libro del catálogo?')) return;
  try {
    const res = await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert('Libro removido del catálogo correctamente.');
      loadCatalog();
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadAdminSales() {
  try {
    const res = await fetch(`${API_URL}/admin/sales`);
    const sales = await res.json();
    renderAdminSales(sales);
  } catch (err) {
    console.error(err);
  }
}

function renderAdminSales(salesList) {
  const tbody = document.getElementById('salesLogTableBody');
  tbody.innerHTML = '';

  if (salesList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No se registran transacciones aún.</td></tr>`;
    return;
  }

  salesList.forEach(sale => {
    const tr = document.createElement('tr');
    tr.classList.add('sales-row-tr');
    tr.title = "Doble clic para eliminar esta venta";
    
    tr.innerHTML = `
      <td><strong>#${sale.id}</strong></td>
      <td>${sale.user_email}</td>
      <td>${sale.date}</td>
      <td style="color:var(--neon-cyan); font-weight:700;">Q${sale.total.toFixed(2)}</td>
      <td><span style="background:rgba(16,185,129,0.15); color:var(--neon-green); padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700; border:1px solid rgba(16,185,129,0.3)">${sale.status}</span></td>
      <td style="text-align:center;">
        <button class="btn-mini-delete" title="Eliminar esta venta">🗑️</button>
      </td>
    `;

    tr.addEventListener('dblclick', () => {
      deleteSingleSale(sale.id);
    });

    tr.querySelector('.btn-mini-delete').addEventListener('click', (e) => {
      e.stopPropagation(); 
      deleteSingleSale(sale.id);
    });

    tbody.appendChild(tr);
  });
}

async function deleteSingleSale(orderId) {
  if (!confirm(`¿Eliminar de los registros la venta #${orderId}?`)) return;
  try {
    const res = await fetch(`${API_URL}/admin/sales/${orderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadAdminSales();
    }
  } catch (err) {
    console.error(err);
  }
}
