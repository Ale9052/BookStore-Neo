const API_URL = "https://bookstore-neo.onrender.com";
let allBooksLocal = [];
let userPaidBookIds = [];

// 1. Visibilidad contraseña (CORREGIDO: Tipo button)
function togglePasswordVisibility(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    input.type = (input.type === 'password') ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// 2. Navegación
function abrirVistaCarrito() {
    document.getElementById('customer-view').classList.add('hidden');
    document.getElementById('cart-view').classList.remove('hidden');
    renderizarVistaCarritoCompleta();
}

function regresarAlCatalogo() {
    document.getElementById('cart-view').classList.add('hidden');
    document.getElementById('customer-view').classList.remove('hidden');
    document.getElementById('admin-view').classList.add('hidden');
}

// 3. Lógica Carrito Completa
async function renderizarVistaCarritoCompleta() {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('cartFullItemsList');
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    
    container.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        total += parseFloat(item.price);
        container.innerHTML += `<div>${item.title} - Q${item.price} 
            <button onclick="eliminarDelCarritoCompleto(${item.id})">Eliminar</button></div>`;
    });
    document.getElementById('summaryTotal').innerText = `Total: Q${total.toFixed(2)}`;
}

async function eliminarDelCarritoCompleto(id) {
    await fetch(`${API_URL}/cart/${id}`, { method: 'DELETE' });
    renderizarVistaCarritoCompleta();
    updateCartCount();
}

// 4. Compra y Desbloqueo (CORREGIDO: Sincronización)
async function procesarCompraFinal() {
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    
    for (let item of cart) {
        await fetch(`${API_URL}/admin/sales`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_email: email, book_id: item.book_id, title: item.title, price: item.price })
        });
        await fetch(`${API_URL}/cart/${item.id}`, { method: 'DELETE' });
    }
    await loadUserPurchases();
    alert("Compra exitosa");
    regresarAlCatalogo();
    renderBooks(allBooksLocal);
    updateCartCount();
}

// 5. Carga de permisos
async function loadUserPurchases() {
    const email = localStorage.getItem('userEmail');
    const sales = await (await fetch(`${API_URL}/admin/sales`)).json();
    userPaidBookIds = sales.filter(s => s.user_email === email).map(s => Number(s.book_id));
}

// 6. Renderizado de libros con candado
function renderBooks(books) {
    const container = document.getElementById('booksContainer');
    container.innerHTML = '';
    books.forEach(b => {
        const hasAccess = localStorage.getItem('userRole') === 'admin' || userPaidBookIds.includes(Number(b.id));
        const div = document.createElement('div');
        div.innerHTML = `<h3>${b.title}</h3>
            <button onclick="handleBookAccess(${b.id})">${hasAccess ? '🔓 Abrir' : '🔒 Comprar'}</button>`;
        container.appendChild(div);
    });
}

async function handleBookAccess(id) {
    const book = allBooksLocal.find(b => b.id === Number(id));
    if (localStorage.getItem('userRole') === 'admin' || userPaidBookIds.includes(Number(id))) {
        window.open(book.full_link, '_blank');
    } else {
        // Lógica para añadir al carrito
        await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: localStorage.getItem('userId'), book_id: id })
        });
        alert("Añadido al carrito");
        updateCartCount();
    }
}

async function updateCartCount() {
    const userId = localStorage.getItem('userId');
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    document.getElementById('cartCount').innerText = cart.length;
}
