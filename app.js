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
      await addToCart(selectedBookForModal.id);
      document.getElementById('purchaseModal').style.display = 'none';
      abrirVistaCarrito();
    }
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
        localStorage.setItem('userName', data.name || email);
        checkSession();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
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
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
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

  // CORRECCIÓN: Lógica mejorada para manejar la edición y creación
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
        await loadCatalog(); // Recargamos el catálogo después de guardar
      } else {
        alert("Error al guardar en base de datos.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al guardar.");
    }
  });

  document.getElementById('clearAllBooksBtn').addEventListener('click', async () => {
    if (confirm('⚠️ ¿Borrar todos los libros?')) {
      await fetch(`${API_URL}/admin/books/clear-all`, { method: 'DELETE' });
      loadCatalog();
    }
  });
});

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

async function renderizarVistaCarritoCompleta() {
  const userId = localStorage.getItem('userId');
  const container = document.getElementById('cartFullItemsList');
  const subtotalLabel = document.getElementById('summarySubtotal');
  const totalLabel = document.getElementById('summaryTotal');
  
  if(!container || !userId) return;

  container.innerHTML = '<p>Cargando...</p>';

  try {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const cartItems = await res.json();
    container.innerHTML = '';

    if (cartItems.length === 0) {
      container.innerHTML = '<p>Tu carrito está vacío.</p>';
      subtotalLabel.textContent = "Q0.00";
      totalLabel.textContent = "Q0.00";
      return;
    }

    let totalSum = 0;
    cartItems.forEach(item => {
      const bookData = allBooksLocal.find(b => b.id === Number(item.book_id)) || item;
      const price = parseFloat(bookData.price) || 0;
      totalSum += price;

      const itemRow = document.createElement('div');
      itemRow.classList.add('cart-main-item');
      itemRow.innerHTML = `
        <img src="${bookData.image}" alt="Portada">
        <div style="flex:1;">
          <div style="color:white; font-weight:bold;">${bookData.title}</div>
          <div style="color:#a0aec0; font-size:0.8rem;">Por ${bookData.author}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:#00f5d4; font-weight:bold;">Q${price.toFixed(2)}</div>
          <button onclick="eliminarDelCarritoCompleto(${item.id})" style="background:none; border:none; color:#e53e3e; cursor:pointer;">Eliminar</button>
        </div>
      `;
      container.appendChild(itemRow);
    });

    subtotalLabel.textContent = `Q${totalSum.toFixed(2)}`;
    totalLabel.textContent = `Q${totalSum.toFixed(2)}`;
  } catch (error) {
    console.error(error);
  }
}

async function eliminarDelCarritoCompleto(cartItemId) {
  await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'DELETE' });
  renderizarVistaCarritoCompleta();
  updateCartCount();
}

// CORRECCIÓN: Actualización optimista para abrir el candado al instante
async function procesarCompraFinal() {
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');
  
  try {
    const resCart = await fetch(`${API_URL}/cart/${userId}`);
    const cartItems = await resCart.json();

    if (cartItems.length === 0) {
      alert("No hay artículos en el carrito.");
      return;
    }

    for (const item of cartItems) {
      const bookData = allBooksLocal.find(b => b.id === Number(item.book_id)) || item;
      
      await fetch(`${API_URL}/admin/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          book_id: item.book_id,
          title: bookData.title,
          price: bookData.price
        })
      });

      // Actualización inmediata para que el candado se abra
      if (!userPaidBookIds.includes(Number(item.book_id))) {
        userPaidBookIds.push(Number(item.book_id));
      }

      await fetch(`${API_URL}/cart/${item.id}`, { method: 'DELETE' });
    }

    alert("¡Pago exitoso!");
    regresarAlCatalogo();
    updateCartCount();
    renderBooks(allBooksLocal); // Renderizado forzado con los nuevos permisos
  } catch (error) {
    console.error("Error:", error);
    alert("Ocurrió un error al procesar el pago.");
  }
}

async function checkSession() {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const headerControls = document.getElementById('header-controls');
  const cartButton = document.getElementById('cartBtn');

  if (userId) {
    headerControls.style.display = 'flex';
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('userGreeting').textContent = localStorage.getItem('userEmail');

    if (userRole === 'admin') {
      document.getElementById('admin-view').classList.remove('hidden');
      document.getElementById('customer-view').classList.add('hidden');
      loadCatalog();
    } else {
      document.getElementById('admin-view').classList.add('hidden');
      document.getElementById('customer-view').classList.remove('hidden');
      if(cartButton) cartButton.style.display = 'inline-flex';
      await loadUserPurchases(); 
      loadCatalog(); 
      updateCartCount();
    }
  }
}

async function loadUserPurchases() {
  const userEmail = localStorage.getItem('userEmail');
  try {
    const res = await fetch(`${API_URL}/admin/sales`);
    const sales = await res.json();
    userPaidBookIds = sales.filter(s => s.user_email === userEmail).map(s => Number(s.book_id));
  } catch (e) { console.error(e); }
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    allBooksLocal = await res.json();
    renderBooks(allBooksLocal);
    renderInventoryTable(allBooksLocal);
  } catch (err) { console.error(err); }
}

function renderBooks(booksList) {
  const container = document.getElementById('booksContainer');
  const userRole = localStorage.getItem('userRole');
  if(!container) return;
  container.innerHTML = '';
  
  const activeCategory = document.querySelector('.btn-category.active').getAttribute('data-category');

  booksList.forEach(book => {
    if (activeCategory !== 'Todos' && book.category !== activeCategory) return;

    const hasAccess = userRole === 'admin' || userPaidBookIds.includes(Number(book.id));
    const card = document.createElement('div');
    card.classList.add('book-card');
    card.innerHTML = `
      <div>
        <img src="${book.image}" alt="${book.title}">
        <div class="book-title">${book.title}</div>
        <div class="book-author">Por ${book.author}</div>
      </div>
      <div>
        <div class="book-price">Q${parseFloat(book.price).toFixed(2)}</div>
        <button class="btn-action" style="background-color:${hasAccess ? '#00f5d4':'#2d3748'}; color:${hasAccess ? 'black':'white'}" onclick="handleBookAccess(${book.id})">
          ${hasAccess ? '🔓 Ver Libro' : '🔒 Comprar'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function handleBookAccess(bookId) {
  const book = allBooksLocal.find(b => b.id === bookId);
  const userRole = localStorage.getItem('userRole');
  const hasAccess = userRole === 'admin' || userPaidBookIds.includes(Number(book.id));

  if (hasAccess) {
    window.open(book.full_link, '_blank');
  } else {
    selectedBookForModal = book;
    document.getElementById('purchaseModal').style.display = 'flex';
  }
}

function renderInventoryTable(booksList) {
  const tableBody = document.getElementById('inventoryTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  booksList.forEach(book => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${book.image}" style="width:30px;"></td>
      <td>${book.title}</td>
      <td>${book.category}</td>
      <td>Q${parseFloat(book.price).toFixed(2)}</td>
      <td>
        <button onclick="startEditBook(${book.id})">Edit</button>
        <button onclick="deleteBook(${book.id})">Del</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function filterBooks(search) {
  const filtered = allBooksLocal.filter(b => b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search));
  renderBooks(filtered);
}

function startEditBook(id) {
  const book = allBooksLocal.find(b => b.id === id);
  isEditing = true;
  document.getElementById('formActionTitle').textContent = "Modificar Libro";
  document.getElementById('btnAdminSubmit').textContent = "Guardar Cambios";
  document.getElementById('adminBookId').value = book.id;
  document.getElementById('adminTitle').value = book.title;
  document.getElementById('adminAuthor').value = book.author;
  document.getElementById('adminCategory').value = book.category;
  document.getElementById('adminPrice').value = book.price;
  document.getElementById('adminImage').value = book.image;
  document.getElementById('adminLink').value = book.full_link;
  document.getElementById('adminBookForm').scrollIntoView({ behavior: 'smooth' });
}

function resetAdminForm() {
  isEditing = false;
  document.getElementById('adminBookForm').reset();
  document.getElementById('adminBookId').value = '';
  document.getElementById('formActionTitle').textContent = "Añadir Nuevo Libro";
  document.getElementById('btnAdminSubmit').textContent = "Publicar Libro";
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
  const res = await fetch(`${API_URL}/cart/${userId}`);
  const cartItems = await res.json();
  document.getElementById('cartCount').textContent = cartItems.length;
}

async function deleteBook(id) {
  if (confirm('¿Eliminar libro?')) {
    await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    loadCatalog();
  }
}
