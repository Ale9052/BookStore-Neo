const API_URL = window.location.origin;
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

  document.getElementById('btnClearHistoryBtn').addEventListener('click', async () => {
    if (confirm('⚠️ ¿Estás seguro de que deseas eliminar TODO el historial de ventas? Esta acción destruirá todos los registros de manera irreversible.')) {
      const res = await fetch(`${API_URL}/admin/sales`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('¡El historial de ventas completo ha sido vaciado!');
        loadAdminSales();
      } else {
        alert('Hubo un error al intentar vaciar el historial.');
      }
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      alert('⚠️ Error: Debes ingresar una cuenta de Gmail válida para registrarte.');
      return;
    }
    if (password.length < 6) {
      alert('⚠️ Error: La contraseña interna debe tener al menos 6 caracteres.');
      return;
    }

    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      alert('¡Cuenta creada y verificado su correo de Gmail con éxito!');
      document.getElementById('registerForm').reset();
      document.getElementById('showLogin').click();
    } else {
      alert(data.error);
    }
  });

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      alert('⚠️ Error: El usuario debe ser una cuenta de Gmail válida.');
      return;
    }

    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('userId', data.id);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userRole', data.role);
      setupUI(data.email, data.role);
    } else {
      alert(data.error);
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });

  document.getElementById('viewCartBtn').addEventListener('click', () => {
    document.getElementById('catalogo-section').classList.add('hidden');
    document.getElementById('cart-section').classList.remove('hidden');
    loadCart();
  });

  document.getElementById('closeCartBtn').addEventListener('click', () => {
    document.getElementById('cart-section').classList.add('hidden');
    document.getElementById('catalogo-section').classList.remove('hidden');
  });

  document.getElementById('bookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editBookId').value;
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const price = document.getElementById('bookPrice').value;
    const image = document.getElementById('bookImage').value;
    const full_link = document.getElementById('bookFullLink').value;
    const badge = document.getElementById('bookBadge').value;

    const isEdit = id !== "";
    const endpoint = isEdit ? `${API_URL}/books/${id}` : `${API_URL}/books`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, price, image, full_link, badge })
    });
    const data = await res.json();
    if (data.success) {
      alert(isEdit ? '¡Libro actualizado correctamente!' : '¡Libro agregado al catálogo!');
      cancelBookEdit();
      loadBooks(localStorage.getItem('userRole'));
    }
  });

  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const totalText = document.getElementById('cartTotal').textContent;
    const total = parseFloat(totalText.replace('Q', ''));

    if (total === 0) return alert('No tienes artículos añadidos.');

    const res = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, total })
    });
    const data = await res.json();
    if (data.success) {
      alert('💳 ¡Compra autorizada y pagada con éxito!\nEl acceso permanente al libro ha sido añadido a tu cuenta.');
      updateCartCount();
      await loadPurchasedBooks();
      loadBooks(localStorage.getItem('userRole'));
      document.getElementById('closeCartBtn').click();
    }
  });
});

function checkSession() {
  const email = localStorage.getItem('userEmail');
  const role = localStorage.getItem('userRole');
  if (email && role) setupUI(email, role);
}

async function setupUI(email, role) {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('shop-section').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.remove('hidden');
  document.getElementById('search-wrapper').classList.remove('hidden');
  
  const greeting = document.getElementById('userGreeting');
  greeting.textContent = email;
  greeting.classList.remove('hidden');

  if (role === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
    loadAdminSales();
  } else {
    document.getElementById('viewCartBtn').classList.remove('hidden');
    updateCartCount();
    await loadPurchasedBooks();
  }
  loadBooks(role);
}

async function loadPurchasedBooks() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  const res = await fetch(`${API_URL}/users/${userId}/purchased`);
  purchasedBooksLocal = await res.json();
}

async function loadBooks(role) {
  const res = await fetch(`${API_URL}/books`);
  allBooksLocal = await res.json();
  renderBooksGrid(allBooksLocal, role || localStorage.getItem('userRole'));
}

function renderBooksGrid(booksList, role) {
  const container = document.getElementById('booksContainer');
  const noResults = document.getElementById('noResultsMessage');
  container.innerHTML = '';

  if (booksList.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');

  booksList.forEach((book) => {
    const card = document.createElement('div');
    card.classList.add('book-card');
    
    const badgeHtml = book.badge ? `<div class="marketing-badge">${book.badge}</div>` : '';

    let priceRowHtml = '';
    if (book.badge === '⚡ Oferta Especial') {
      const originalPrice = (book.price / 0.8).toFixed(2); 
      priceRowHtml = `
        <div class="price-row">
          <span class="price">Q${book.price.toFixed(2)}</span>
          <span class="old-price">Q${originalPrice}</span>
        </div>
      `;
    } else {
      priceRowHtml = `
        <div class="price-row">
          <span class="price">Q${book.price.toFixed(2)}</span>
        </div>
      `;
    }

    const hasPurchased = purchasedBooksLocal.includes(book.title);

    let actionsHtml = '';
    if (role === 'admin') {
      // El administrador siempre ve el acceso directo sin restricciones
      actionsHtml = `
        <a href="${book.full_link}" target="_blank" class="btn-read-full">Ver Libro Completo 🔓</a>
        <div class="admin-card-actions">
          <button class="btn-card-edit" onclick="startEditBook(${book.id})">Editar</button>
          <button class="btn-card-delete" onclick="deleteBook(${book.id})">Eliminar</button>
        </div>
      `;
    } else {
      if (hasPurchased) {
        // Si ya lo compró, el botón lo redirige directamente de una vez
        actionsHtml = `<button class="btn-read-full" onclick="openPurchasedBook('${book.full_link}')">Leer Libro Completo 🔓</button>`;
      } else {
        // Si no lo ha comprado, llama a la función interactiva de advertencia y compra
        actionsHtml = `<button class="btn-shop-buy" onclick="handleBookAccessAttempt(${book.id}, '${book.title}')">Ver Libro Completo 📖</button>`;
      }
    }

    card.innerHTML = `
      ${badgeHtml}
      <img src="${book.image}" onerror="this.src='https://via.placeholder.com/250x350?text=Sin+Portada'">
      <div class="book-details">
        <h3>${book.title}</h3>
        <p>Por ${book.author}</p>
      </div>
      ${priceRowHtml}
      ${actionsHtml}
    `;
    container.appendChild(card);
  });
}

// Función interactiva cuando un usuario que NO ha comprado el libro intenta acceder
function handleBookAccessAttempt(bookId, bookTitle) {
  const confirmPurchase = confirm(`ℹ️ Contenido Restringido:\nPara acceder a "${bookTitle}" necesitas adquirir la licencia del libro completo.\n\n¿Deseas añadir este libro a tu carrito de compras ahora mismo?`);
  
  if (confirmPurchase) {
    addToCart(bookId);
  }
}

// Función directa para usuarios que ya pagaron por el libro
function openPurchasedBook(link) {
  window.open(link, '_blank');
}

function startEditBook(id) {
  const book = allBooksLocal.find(b => b.id === id);
  if (!book) return;

  document.getElementById('editBookId').value = book.id;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookPrice').value = book.price;
  document.getElementById('bookImage').value = book.image;
  document.getElementById('bookFullLink').value = book.full_link || "";
  document.getElementById('bookBadge').value = book.badge || "";

  document.getElementById('formAdminTitle').textContent = "✏️ Modificar Libro";
  document.getElementById('btnAdminSubmit').textContent = "Guardar Cambios";
  document.getElementById('btnCancelEdit').classList.remove('hidden');

  document.getElementById('adminFormWrapper').scrollIntoView({ behavior: 'smooth' });
}

function cancelBookEdit() {
  document.getElementById('bookForm').reset();
  document.getElementById('editBookId').value = "";
  document.getElementById('formAdminTitle').textContent = "Añadir Nuevo Libro";
  document.getElementById('btnAdminSubmit').textContent = "Guardar en Inventario";
  document.getElementById('btnCancelEdit').classList.add('hidden');
}

function filterBooks(searchTerm) {
  const role = localStorage.getItem('userRole');
  const filtered = allBooksLocal.filter(book => 
    book.title.toLowerCase().includes(searchTerm) || 
    book.author.toLowerCase().includes(searchTerm)
  );
  renderBooksGrid(filtered, role);
}

async function addToCart(bookId) {
  const userId = localStorage.getItem('userId');
  await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bookId })
  });
  updateCartCount();
  
  const toast = document.createElement('div');
  toast.style = "position:fixed; bottom:20px; right:20px; background:var(--neon-green); color:white; padding:12px 24px; border-radius:8px; font-weight:600; z-index:1000; box-shadow: 0 0 15px rgba(16,185,129,0.4);";
  toast.textContent = "📚 ¡Libro añadido al carrito correctamente!";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

async function updateCartCount() {
  const userId = localStorage.getItem('userId');
  if (!userId) return;
  const res = await fetch(`${API_URL}/cart/${userId}`);
  const cartItems = await res.json();
  const count = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

async function loadCart() {
  const userId = localStorage.getItem('userId');
  const res = await fetch(`${API_URL}/cart/${userId}`);
  const cartItems = await res.json();
  const container = document.getElementById('cartItemsContainer');
  container.innerHTML = '';
  
  let total = 0;
  cartItems.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <img src="${item.image}">
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>${item.quantity} x Q${item.price.toFixed(2)}</p>
      </div>
      <button class="btn-remove-item" onclick="removeCartItem(${item.cartItemId})">Eliminar</button>
    `;
    container.appendChild(div);
  });
  document.getElementById('cartTotal').textContent = `Q${total.toFixed(2)}`;
  document.getElementById('cartTotalFinal').textContent = `Q${total.toFixed(2)}`;
}

async function removeCartItem(cartItemId) {
  await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'DELETE' });
  loadCart();
  updateCartCount();
}

async function deleteBook(id) {
  if (confirm('¿Deseas remover este libro de las estanterías de forma permanente?')) {
    await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    loadBooks('admin');
  }
}

async function loadAdminSales() {
  const res = await fetch(`${API_URL}/admin/sales`);
  const sales = await res.json();
  const tbody = document.getElementById('salesTableBody');
  tbody.innerHTML = '';

  if(sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">No hay transacciones registradas.</td></tr>`;
    return;
  }

  sales.forEach(sale => {
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
  if (confirm(`¿Estás seguro de que deseas eliminar únicamente la Orden #${orderId}?`)) {
    const res = await fetch(`${API_URL}/admin/sales/${orderId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      alert(`¡La Orden #${orderId} ha sido eliminada con éxito!`);
      loadAdminSales();
    } else {
      alert('Error al intentar eliminar la orden seleccionada.');
    }
  }
}
