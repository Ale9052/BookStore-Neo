const API_URL = "https://bookstore-neo.onrender.com";
let allBooksLocal = [];
let userPaidBookIds = [];

// Función corregida para el icono de contraseña
function togglePasswordVisibility(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    input.type = (input.type === 'password') ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

// Navegación segura entre vistas
function abrirVistaCarrito() {
    document.getElementById('customer-view').classList.add('hidden');
    document.getElementById('cart-view').classList.remove('hidden');
    renderizarVistaCarritoCompleta();
}

function regresarAlCatalogo() {
    document.getElementById('cart-view').classList.add('hidden');
    document.getElementById('customer-view').classList.remove('hidden');
}

// Sincronización de compra y desbloqueo
async function procesarCompraFinal() {
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const cart = await (await fetch(`${API_URL}/cart/${userId}`)).json();
    
    if (cart.length === 0) return;

    for (let item of cart) {
        await fetch(`${API_URL}/admin/sales`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_email: email, book_id: item.book_id, title: item.title, price: item.price })
        });
        await fetch(`${API_URL}/cart/${item.id}`, { method: 'DELETE' });
    }

    await loadUserPurchases();
    alert("¡Compra procesada con éxito!");
    regresarAlCatalogo();
    renderBooks(allBooksLocal);
    updateCartCount();
}

async function loadUserPurchases() {
    const email = localStorage.getItem('userEmail');
    const response = await fetch(`${API_URL}/admin/sales`);
    const sales = await response.json();
    userPaidBookIds = sales.filter(s => s.user_email === email).map(s => Number(s.book_id));
}

function renderBooks(books) {
    const container = document.getElementById('booksContainer');
    container.innerHTML = '';
    books.forEach(b => {
        const hasAccess = localStorage.getItem('userRole') === 'admin' || userPaidBookIds.includes(Number(b.id));
        const div = document.createElement('div');
        div.className = 'book-card';
        div.innerHTML = `<h3>${b.title}</h3>
            <button onclick="handleBookAccess(${b.id})">${hasAccess ? '🔓 Abrir' : '🔒 Comprar'}</button>`;
        container.appendChild(div);
    });
}
