// 1. Configuración de la URL de Render
const API_URL = "https://bookstore-neo.onrender.com";

// 2. Base de datos local de tus libros (Asegúrate de cambiar los nombres de las imágenes si usas otras)
const libros = [
    { id: 1, titulo: "JavaScript Moderno", autor: "Carlos Pérez", categoria: "programacion", precio: 250, imagen: "javascript.jpg" },
    { id: 2, titulo: "El Despertar del Mago", autor: "Elena Gómez", categoria: "fantasia", precio: 175, imagen: "fantasia.jpg" },
    { id: 3, titulo: "La Sombra en la Oscuridad", autor: "Mario Ross", categoria: "terror", precio: 190, imagen: "terror.jpg" },
    { id: 4, titulo: "Metas Sin Límites", autor: "Laura Casillas", categoria: "superacion", precio: 150, imagen: "superacion.jpg" },
    { id: 5, titulo: "Python desde Cero", autor: "Guido Van", categoria: "programacion", precio: 300, imagen: "python.jpg" }
];

document.addEventListener('DOMContentLoaded', () => {
    // Captura de formularios y contenedores
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    
    // Secciones principales
    const authSection = document.getElementById('auth-section');
    const storeSection = document.getElementById('store-section');
    const librosContainer = document.getElementById('libros-container') || document.querySelector('.books-grid') || document.getElementById('catalog');
    
    // Filtros y Buscador
    const searchInput = document.getElementById('search-input') || document.querySelector('input[type="text"]');
    const categoryButtons = document.querySelectorAll('.category-btn') || document.querySelectorAll('[data-category]');

    // Elementos del menú (Header)
    const userDisplay = document.getElementById('user-display') || document.querySelector('.user-info');
    const usernameText = document.getElementById('username-text') || document.querySelector('#hola-usuario');
    const btnLogout = document.getElementById('btn-logout') || document.querySelector('.btn-logout') || document.getElementById('cerrar-sesion');

    // ==========================================
    // FUNCIÓN: RENDERIZAR LIBROS EN PANTALLA
    // ==========================================
    function mostrarLibros(listaDeLibros) {
        if (!librosContainer) return;
        librosContainer.innerHTML = ""; // Limpiar contenedor

        if (listaDeLibros.length === 0) {
            librosContainer.innerHTML = `<p class="no-results">No se encontraron libros que coincidan con tu búsqueda.</p>`;
            return;
        }

        listaDeLibros.forEach(libro => {
            const libroCard = document.createElement('div');
            libroCard.className = 'book-card';
            libroCard.innerHTML = `
                <img src="${libro.imagen}" alt="${libro.titulo}" class="book-img" onerror="this.src='https://via.placeholder.com/150x220?text=Libro'">
                <div class="book-info">
                    <h3>${libro.titulo}</h3>
                    <p class="author">${libro.autor}</p>
                    <span class="category-tag">${libro.categoria.toUpperCase()}</span>
                    <p class="price">Q${libro.precio.toFixed(2)}</p>
                    <button class="btn-add-cart" onclick="alert('¡Funcionalidad de carrito próximamente!')">Agregar al carrito</button>
                </div>
            `;
            librosContainer.appendChild(libroCard);
        });
    }

    // Cargar todos los libros al arrancar la página de forma automática
    mostrarLibros(libros);

    // ==========================================
    // BUSCADOR Y FILTROS POR CATEGORÍA
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const texto = e.target.value.toLowerCase().trim();
            const filtrados = libros.filter(libro => 
                libro.titulo.toLowerCase().includes(texto) || 
                libro.autor.toLowerCase().includes(texto)
            );
            mostrarLibros(filtrados);
        });
    }

    if (categoryButtons.length > 0) {
        categoryButtons.forEach(boton => {
            boton.addEventListener('click', () => {
                // Remover clase activa de todos y ponerla en el seleccionado
                categoryButtons.forEach(b => b.classList.remove('active'));
                boton.classList.add('active');

                const categoria = boton.getAttribute('data-category') || boton.textContent.toLowerCase().trim();
                
                if (categoria === 'todos' || categoria.includes('todos')) {
                    mostrarLibros(libros);
                } else {
                    const filtrados = libros.filter(libro => 
                        categoria.includes(libro.categoria) || libro.categoria === categoria
                    );
                    mostrarLibros(filtrados);
                }
            });
        });
    }

    // ==========================================
    // CONTROL VISUAL: INTERCAMBIAR LOGIN / REGISTRO
    // ==========================================
    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if(loginBox) loginBox.classList.add('hidden');
            if(registerBox) registerBox.classList.remove('hidden');
        });
    }

    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if(registerBox) registerBox.classList.add('hidden');
            if(loginBox) loginBox.classList.remove('hidden');
        });
    }

    // ==========================================
    // PROCESO DE REGISTRO CON RENDER
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('register-name').value.trim();
            const correo = document.getElementById('register-email').value.trim();
            const contrasena = document.getElementById('register-password').value.trim();

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, correo, contrasena })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert(data.message || '¡Cuenta creada con éxito!');
                    if(registerBox && loginBox) {
                        registerBox.classList.add('hidden');
                        loginBox.classList.remove('hidden');
                    }
                } else {
                    alert(data.message || 'Error al procesar el registro.');
                }
            } catch (error) {
                console.error("Error:", error);
                alert('No se pudo conectar con el servidor de Render.');
            }
        });
    }

    // ==========================================
    // PROCESO DE INICIO DE SESIÓN (LOGIN)
    // ==========================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('login-email').value.trim();
            const contrasena = document.getElementById('login-password').value.trim();

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo, contrasena })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert("¡Bienvenido! " + data.usuario.nombre);

                    // Transición de pantallas
                    if(authSection) authSection.classList.add('hidden');
                    if(storeSection) storeSection.classList.remove('hidden');
                    if(userDisplay) userDisplay.classList.remove('hidden');
                    if(btnLogout) btnLogout.classList.remove('hidden');
                    if(usernameText) usernameText.textContent = data.usuario.nombre;
                } else {
                    alert(data.message || 'Usuario o contraseña incorrectos.');
                }
            } catch (error) {
                console.error("Error:", error);
                alert('No se pudo conectar con el servidor de Render.');
            }
        });
    }

    // ==========================================
    // CERRAR SESIÓN
    // ==========================================
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if(authSection) authSection.classList.remove('hidden');
            if(loginBox) loginBox.classList.remove('hidden');
            if(registerBox) registerBox.classList.add('hidden');
            if(storeSection) storeSection.classList.add('hidden');
            if(userDisplay) userDisplay.classList.add('hidden');
            if(btnLogout) btnLogout.classList.add('hidden');
            
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
            alert('Sesión cerrada correctamente.');
        });
    }
});
