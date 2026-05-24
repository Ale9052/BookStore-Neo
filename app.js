const API_URL = "https://bookstore-neo.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');

    const authSection = document.getElementById('auth-section');
    const storeSection = document.getElementById('store-section');
    const userDisplay = document.getElementById('user-display');
    const usernameText = document.getElementById('username-text');
    const btnLogout = document.getElementById('btn-logout');

    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginBox.classList.add('hidden');
            registerBox.classList.remove('hidden');
        });
    }

    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
        });
    }

    const sessionUser = localStorage.getItem('usuarioLogueado');
    if (sessionUser) {
        const user = JSON.parse(sessionUser);
        activarVistaTienda(user);
    }

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

                if (data.success) {
                    alert(data.message);
                    localStorage.setItem('usuarioLogueado', JSON.stringify(data.user));
                    activarVistaTienda(data.user);
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error en login:', error);
                alert('No se pudo conectar con el servidor.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('register-name').value.trim();
            const correo = document.getElementById('register-email').value.trim();
            const contrasena = document.getElementById('register-password').value.trim();

            if (contrasena.length < 6) {
                alert('La contraseña requiere un mínimo de 6 caracteres.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, correo, contrasena })
                });

                const data = await response.json();

                if (data.success) {
                    alert(data.message + ' Ya puedes iniciar sesión.');
                    registerBox.classList.add('hidden');
                    loginBox.classList.remove('hidden');
                } else {
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                console.error('Error en registro:', error);
                alert('Error al intentar conectar con el servidor.');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuarioLogueado');
            alert('Sesión finalizada.');
            window.location.reload();
        });
    }

    function activarVistaTienda(user) {
        authSection.classList.add('hidden');
        storeSection.classList.remove('hidden');
        userDisplay.classList.remove('hidden');
        btnLogout.classList.remove('hidden');
        
        // Muestra el nombre registrado en la barra de navegación
        usernameText.textContent = user.nombre || user.correo;

        const btnCart = document.getElementById('btn-cart-view');
        if (btnCart) btnCart.classList.remove('hidden');
        cargarLibrosCliente();
    }

    function cargarLibrosCliente() {
        const container = document.getElementById('books-container');
        container.innerHTML = `
            <div class="book-card">
                <img src="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=1000" alt="Libro">
                <div class="book-details">
                    <span class="book-category-tag">Programación</span>
                    <h3>Estructuras de Datos</h3>
                    <p>Optimización y desarrollo de sistemas backend avanzados.</p>
                    <div class="price-row"><span class="price">Q150.00</span></div>
                    <button class="btn-shop-buy">Añadir al Carrito</button>
                </div>
            </div>
        `;
    }
});
