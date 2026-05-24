// 1. Configuración de la URL de Render (Asegúrate de que coincida con tu servicio)
const API_URL = "https://bookstore-neo.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    // Captura de formularios
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Cajas visuales de login y registro
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    
    // Enlaces para cambiar entre Login y Registro
    const goToRegister = document.getElementById('go-to-register');
    const goToLogin = document.getElementById('go-to-login');
    
    // Secciones principales del cuerpo
    const authSection = document.getElementById('auth-section');
    const storeSection = document.getElementById('store-section');
    
    // Elementos del menú de navegación (Header)
    const userDisplay = document.getElementById('user-display');
    const usernameText = document.getElementById('username-text');
    const btnLogout = document.getElementById('btn-logout');
    const btnCartView = document.getElementById('btn-cart-view');

    // Intercambiar vista a Registro
    if (goToRegister) {
        goToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginBox.classList.add('hidden');
            registerBox.classList.remove('hidden');
        });
    }

    // Intercambiar vista a Login
    if (goToLogin) {
        goToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerBox.classList.add('hidden');
            loginBox.classList.remove('hidden');
        });
    }

    // ==========================================
    // PROCESO DE REGISTRO
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
                    alert(data.message || '¡Cuenta creada con éxito! Ahora inicia sesión.');
                    // Regresar al cuadro de login automáticamente
                    registerBox.classList.add('hidden');
                    loginBox.classList.remove('hidden');
                } else {
                    alert(data.message || 'Error al registrar el usuario.');
                }
            } catch (error) {
                console.error("Error en registro:", error);
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

                    // 1. Ocultar la sección de autenticación completa
                    authSection.classList.add('hidden');

                    // 2. Mostrar la tienda/catálogo de libros
                    storeSection.classList.remove('hidden');

                    // 3. Mostrar elementos del menú de navegación (Header)
                    userDisplay.classList.remove('hidden');
                    btnLogout.classList.remove('hidden');
                    if (btnCartView) btnCartView.classList.remove('hidden');

                    // 4. Colocar el nombre del usuario logueado en el texto
                    usernameText.textContent = data.usuario.nombre;
                } else {
                    alert(data.message || 'Usuario o contraseña incorrectos.');
                }
            } catch (error) {
                console.error("Error en login:", error);
                alert('No se pudo conectar con el servidor de Render.');
            }
        });
    }

    // ==========================================
    // PROCESO DE CERRAR SESIÓN
    // ==========================================
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            // Regresar todo a su estado inicial
            authSection.classList.remove('hidden');
            loginBox.classList.remove('hidden');
            registerBox.classList.add('hidden');
            
            storeSection.classList.add('hidden');
            userDisplay.classList.add('hidden');
            btnLogout.classList.add('hidden');
            if (btnCartView) btnCartView.classList.add('hidden');
            
            // Limpiar los inputs
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
            
            alert('Has cerrado sesión correctamente.');
        });
    }
});
