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

  // CONTROLADOR DE BÚSQUEDA CORREGIDO CON MENSAJE DE ERROR
  document.getElementById('bookSearchInput').addEventListener('input', (e) => {
    filterBooks(e.target.value.toLowerCase().trim());
  });

  document.getElementById('modalAddToCartBtn').addEventListener('click', async () => {
    if (selectedBookForModal) {
      await addToCart(selectedBookForModal.id);
      document.getElementById('purchaseModal').style.display = 'none';
      alert(`¡"${selectedBookForModal.title}" añadido al carrito! Completa tu pago desde el botón superior.`);
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
      console.error("Error en login:", error);
      alert("No se pudo conectar con el servidor de Render.");
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
      if (data.success) {
        alert(isEditing ? "¡Libro actualizado!" : "¡Libro publicado!");
        resetAdminForm();
        setTimeout(() => { loadCatalog(); }, 500);
      }
    } catch (err) {
      console.error(err);
    }
  });

  document.getElementById('clearAllBooksBtn').addEventListener('click', async () => {
    if (confirm('⚠️ ¿Borrar absolutamente todos los libros de la base de datos?')) {
      await fetch(`${API_URL}/admin/books/clear-all`, { method: 'DELETE' });
      loadCatalog();
    }
  });
});

// CONTROLADOR DE SESIONES CORREGIDO (PREVIENE VISUALIZACIÓN PREVIA)
async function checkSession() {
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');

  const headerControls = document.getElementById('header-controls');
  const cartButton = document.getElementById('cartBtn');

  if (userId) {
    // 1. Mostrar barra superior completa (Buscador y menú)
    headerControls.classList.remove('hidden');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    document.getElementById('userGreeting').textContent = userEmail;

    if (userRole === 'admin') {
      document.getElementById('admin-view').classList.remove('hidden');
      document.getElementById('customer-view').classList.add('hidden');
      
      // Ocultar carrito de forma estricta al admin en cualquier dispositivo
      if(cartButton) cartButton.style.setProperty('display', 'none', 'important');
      
      loadCatalog();
    } else {
      document.getElementById('admin-view').classList.add('hidden');
      document.getElementById('customer-view').classList.remove('hidden');
      
      // Mostrar el carrito de forma estricta e inline al cliente
      if(cartButton) cartButton.style.setProperty('display', 'inline-flex', 'important');
      
      await loadUserPurchases(); 
      loadCatalog(); 
      updateCartCount();
    }
  } else {
    // Si no hay sesión, esconder buscador, carrito y saludo por completo
    headerControls.classList.add('hidden');
    if(cartButton) cartButton.style.setProperty('display', 'none', 'important');
    
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('app-content').classList.add('hidden');
  }
}

async function loadUserPurchases() {
  const userEmail = localStorage.getItem('userEmail');
  try {
    const res = await fetch(`${API_URL}/admin/sales`);
    const sales = await res.json();
    const myPurchases = sales.filter(sale => sale.user_email === userEmail);
    
    userPaidBookIds = [];
    myPurchases.forEach(sale => {
       if(sale.book_id) userPaidBookIds.push(Number(sale.book_id));
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_URL}/books`);
    allBooksLocal = await res.json();
    renderBooks(allBooksLocal);
    renderInventoryTable(allBooksLocal);
  } catch (err) {
    console.error(err);
  }
}

function renderBooks(booksList) {
  const container = document.getElementById('booksContainer');
  const noBooksMessage = document.getElementById('noBooksMessage');
  if(!container) return;
  container.innerHTML = '';
  
  const activeCategory = document.querySelector('.btn-category.active').getAttribute('data-category');
  const userRole = localStorage.getItem('userRole');

  let visibleBooksCount = 0;

  booksList.forEach(book => {
    if (activeCategory !== 'Todos' && book.category !== activeCategory) return;

    visibleBooksCount++;

    const hasAccess = userRole === 'admin' || userPaidBookIds.includes(Number(book.id));
    const lockIcon = hasAccess ? "🔓 Ver Libro Completo" : "🔒 Ver Libro Completo";

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
        <button class="btn-action" style="width:100%; font-weight:bold; background-color:${hasAccess ? '#00f5d4':'#2d3748'}; color:${hasAccess ? 'black':'white'}" onclick="handleBookAccess(${book.id})">${lockIcon}</button>
      </div>
    `;
    container.appendChild(card);
  });

  // SI NO HAY LIBROS COINCIDENTES MOSTRAR EL MENSAJE EN PANTALLA
  if (visibleBooksCount === 0) {
    if(noBooksMessage) noBooksMessage.style.display = 'block';
  } else {
    if(noBooksMessage) noBooksMessage.style.display = 'none';
  }
}

function handleBookAccess(bookId) {
  const book = allBooksLocal.find(b => b.id === bookId);
  if (!book) return;

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
      <td><img src="${book.image || 'https://via.placeholder.com/150'}" alt="Portada" style="width: 35px; height: 48px; object-fit: cover; border-radius: 4px;"></td>
      <td><strong>${book.title}</strong><br><span style="color: #a0aec0; font-size: 0.75rem;">${book.author}</span></td>
      <td><span class="status-badge">${book.category}</span></td>
      <td><strong>Q${parseFloat(book.price).toFixed(2)}</strong></td>
      <td>
        <div style="display: flex; gap: 5px;">
          <button type="button" style="background-color: #ffc107; color: black; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" onclick="startEditBook(${book.id})"><i class="fas fa-edit"></i></button>
          <button type="button" style="background-color: #dc3545; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;" onclick="deleteBook(${book.id})"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// FILTRADO ADAPTADO PARA LANZAR EL MENSAJE DE ADVERTENCIA SI QUEDA VACÍO
function filterBooks(search) {
  const filtered = allBooksLocal.filter(b => b.title.toLowerCase().includes(search) || b.author.toLowerCase().includes(search));
  renderBooks(filtered);
}

function startEditBook(id) {
  const book = allBooksLocal.find(b => b.id === id);
  if (!book) return;

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
  if(!userId) return;
  try {
    const res = await fetch(`${API_URL}/cart/${userId}`);
    const cartItems = await res.json();
    document.getElementById('cartCount').textContent = cartItems.length;
  } catch (error) {
    console.error(error);
  }
}

async function deleteBook(id) {
  if (confirm('¿Eliminar este libro definitivamente?')) {
    await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
    loadCatalog();
  }
}
