// 1. CONFIGURACIÓN E INICIALIZACIÓN
const API_URL = "https://bookstore-neo.onrender.com";
let allBooksLocal = [];
let userPaidBookIds = [];
let selectedBookForModal = null;

// 2. INICIO DE SESIÓN Y GESTIÓN DE ESTADO
async function loginUser() {
    // ... AQUÍ VA TU LÓGICA DE LOGIN ORIGINAL QUE MANEJA EL LOCALSTORAGE ...
    // Asegúrate de que después de loguear llames a:
    // await initApp();
}

// 3. CARGA DE DATOS (ADMIN + CUSTOMER)
async function initApp() {
    // ... CARGA DE TODOS LOS LIBROS (allBooksLocal) ...
    // ... CARGA DE VENTAS (loadUserPurchases) ...
    // ... LLAMADA A RENDERBOOKS O RENDERINVENTORY SEGÚN ROL ...
}

// 4. LÓGICA DEL CARRITO (ELIMINACIÓN Y PROCESAMIENTO)
async function eliminarDelCarritoCompleto(cartItemId) {
    // ESTA FUNCIÓN ES VITAL: Debe usar el ID de la tabla carrito, no el book_id
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'DELETE' });
    if (res.ok) {
        await renderizarVistaCarritoCompleta();
        await updateCartCount();
    }
}

async function procesarCompraFinal() {
    // ... LOGICA DE ITERAR CARRITO, POST A SALES, DELETE A CART ...
    // ... LLAMAR A LOADUSERPURCHASES() DESPUÉS DE LA COMPRA ...
    // ... RENDERIZAR VISTA DE NUEVO PARA ACTUALIZAR CANDADOS ...
}

// 5. RENDERIZADO (LA CLAVE DEL CANDADO)
function renderBooks(books) {
    const container = document.getElementById('booksContainer');
    container.innerHTML = '';
    books.forEach(book => {
        const hasAccess = userPaidBookIds.includes(Number(book.id));
        const div = document.createElement('div');
        div.innerHTML = `
            <img src="${book.image}">
            <h3>${book.title}</h3>
            <button onclick="handleBookAccess(${book.id})">
                ${hasAccess ? '🔓 Abrir' : '🔒 Comprar'}
            </button>
        `;
        container.appendChild(div);
    });
}

// 6. MANEJO DE ACCESO
function handleBookAccess(bookId) {
    const book = allBooksLocal.find(b => b.id === Number(bookId));
    if (userPaidBookIds.includes(Number(bookId))) {
        window.open(book.full_link, '_blank');
    } else {
        // ... LÓGICA PARA ABRIR MODAL O AÑADIR A CARRITO ...
    }
}

// 7. FUNCIONES DE UTILIDAD (TOGGLE, BUSCADOR, ETC)
function togglePasswordVisibility(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    input.type = (input.type === 'password') ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}
