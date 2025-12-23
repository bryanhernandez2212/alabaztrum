// Script para actualizar el navbar según el estado de autenticación
// Usa AuthManager para obtener el estado de forma síncrona

// Función para mostrar el navbar después de verificar el rol
// Solo para navbar normal, no para admin
function showNavbar() {
    if (document.body.classList.contains('admin-body')) {
        return; // No hacer nada en páginas de admin
    }
    const header = document.getElementById('main-header');
    const nav = document.getElementById('main-nav');
    if (header) {
        header.style.visibility = 'visible';
        header.style.opacity = '1';
        header.style.transition = 'opacity 0.3s ease';
    }
    if (nav) {
        nav.style.visibility = 'visible';
        nav.style.opacity = '1';
        nav.style.transition = 'opacity 0.3s ease';
    }
}

// Función para actualizar navbar usando AuthManager (síncrono)
function updateNavbarFromAuthManager(state) {
    if (document.body.classList.contains('admin-body')) {
        return;
    }
    
    const notLoggedDiv = document.getElementById('user-not-logged');
    const notLoggedMenu = document.getElementById('user-not-logged-menu');
    const loggedDiv = document.getElementById('user-logged');
    const loggedMenu = document.getElementById('user-logged-menu');
    const userNameSpan = document.getElementById('user-name');
    
    if (state.isAuthenticated && state.user) {
        console.log('Navbar: Mostrando elementos de autenticado');
        console.log('Navbar: notLoggedDiv encontrado:', !!notLoggedDiv);
        console.log('Navbar: loggedDiv encontrado:', !!loggedDiv);
        console.log('Navbar: userNameSpan encontrado:', !!userNameSpan);
        
        // Ocultar elementos de no autenticado
        if (notLoggedDiv) {
            notLoggedDiv.classList.add('hidden');
            notLoggedDiv.style.setProperty('display', 'none', 'important');
            notLoggedDiv.style.setProperty('visibility', 'hidden', 'important');
            console.log('Navbar: Ocultado notLoggedDiv');
        }
        if (notLoggedMenu) {
            notLoggedMenu.classList.add('hidden');
            notLoggedMenu.style.setProperty('display', 'none', 'important');
        }
        
        // Mostrar elementos de autenticado
        if (loggedDiv) {
            loggedDiv.classList.remove('hidden');
            loggedDiv.style.setProperty('display', 'flex', 'important');
            loggedDiv.style.setProperty('visibility', 'visible', 'important');
            console.log('Navbar: Mostrado loggedDiv');
        }
        if (loggedMenu) {
            loggedMenu.classList.remove('hidden');
            loggedMenu.style.setProperty('display', 'block', 'important');
        }
        
        // Actualizar nombre de usuario
        if (userNameSpan) {
            let displayName = 'Mi cuenta';
            
            // Intentar obtener el nombre del estado
            if (state.userData && state.userData.fullName) {
                displayName = state.userData.fullName;
            } else if (state.user && state.user.displayName) {
                displayName = state.user.displayName;
            } else if (state.user && state.user.email) {
                displayName = state.user.email;
            } else if (typeof authManager !== 'undefined') {
                // Fallback: usar AuthManager si el estado no tiene el nombre
                displayName = authManager.getDisplayName() || 'Mi cuenta';
            }
            
            const truncatedName = displayName.length > 15 
                ? displayName.substring(0, 15) + '...' 
                : displayName;
            userNameSpan.textContent = truncatedName;
            
            console.log('Navbar: Nombre actualizado a:', truncatedName);
            console.log('Navbar: userNameSpan.textContent después:', userNameSpan.textContent);
        } else {
            console.error('Navbar: userNameSpan no encontrado!');
        }
        
        // Verificar que los elementos estén correctamente visibles después de un pequeño delay
        setTimeout(() => {
            if (loggedDiv) {
                const isVisible = !loggedDiv.classList.contains('hidden') && 
                                 loggedDiv.style.display !== 'none' && 
                                 loggedDiv.offsetWidth > 0;
                console.log('Navbar: Verificación final - loggedDiv visible:', isVisible);
                console.log('Navbar: loggedDiv.classList:', loggedDiv.classList.toString());
                console.log('Navbar: loggedDiv.style.display:', loggedDiv.style.display);
                console.log('Navbar: loggedDiv.offsetWidth:', loggedDiv.offsetWidth);
            }
            if (notLoggedDiv) {
                const isHidden = notLoggedDiv.classList.contains('hidden') || 
                                notLoggedDiv.style.display === 'none' || 
                                notLoggedDiv.offsetWidth === 0;
                console.log('Navbar: Verificación final - notLoggedDiv oculto:', isHidden);
            }
        }, 100);
        
        // Actualizar menú móvil
        const mobileUserNotLogged = document.getElementById('mobile-user-not-logged');
        const mobileUserLogged = document.getElementById('mobile-user-logged');
        if (mobileUserNotLogged) mobileUserNotLogged.classList.add('hidden');
        if (mobileUserLogged) mobileUserLogged.classList.remove('hidden');
        
        // Actualizar UI según rol
        updateNavbarRoleUI(state.role);
        
    } else {
        // Ocultar elementos de autenticado
        if (loggedDiv) {
            loggedDiv.classList.add('hidden');
            loggedDiv.style.setProperty('display', 'none', 'important');
            loggedDiv.style.setProperty('visibility', 'hidden', 'important');
        }
        if (loggedMenu) {
            loggedMenu.classList.add('hidden');
            loggedMenu.style.setProperty('display', 'none', 'important');
        }
        
        // Mostrar elementos de no autenticado
        if (notLoggedDiv) {
            notLoggedDiv.classList.remove('hidden');
            notLoggedDiv.style.setProperty('display', 'flex', 'important');
            notLoggedDiv.style.setProperty('visibility', 'visible', 'important');
        }
        if (notLoggedMenu) {
            notLoggedMenu.classList.remove('hidden');
            notLoggedMenu.style.setProperty('display', 'block', 'important');
        }
        
        // Actualizar menú móvil
        const mobileUserNotLogged = document.getElementById('mobile-user-not-logged');
        const mobileUserLogged = document.getElementById('mobile-user-logged');
        if (mobileUserNotLogged) mobileUserNotLogged.classList.remove('hidden');
        if (mobileUserLogged) mobileUserLogged.classList.add('hidden');
        
        // Mostrar elementos de cliente por defecto
        const searchBar = document.getElementById('search-bar');
        const cartIcon = document.getElementById('cart-icon');
        const clientNav = document.getElementById('client-nav');
        const adminMenuHeader = document.getElementById('admin-menu-header');
        
        if (searchBar) searchBar.classList.remove('hidden');
        if (cartIcon) cartIcon.classList.remove('hidden');
        if (clientNav) clientNav.classList.remove('hidden');
        if (adminMenuHeader) adminMenuHeader.classList.add('hidden');
    }
    
    // Mostrar navbar
    showNavbar();
}

// Función auxiliar para actualizar la UI según el rol
function updateNavbarRoleUI(userRole) {
    const profileLink = document.getElementById('profile-link');
    const searchBar = document.getElementById('search-bar');
    const cartIcon = document.getElementById('cart-icon');
    const clientNav = document.getElementById('client-nav');
    const adminNav = document.getElementById('admin-nav');
    const adminMenuHeader = document.getElementById('admin-menu-header');
    
    if (userRole === 'administrador') {
        // Mostrar opción de administración en el menú
        if (profileLink) {
            let adminLink = document.getElementById('admin-link');
            if (!adminLink) {
                adminLink = document.createElement('a');
                adminLink.id = 'admin-link';
                adminLink.href = '/admin';
                adminLink.className = 'dropdown-item';
                adminLink.innerHTML = '<i class="fas fa-shield-alt mr-2"></i>Panel de Administración';
                profileLink.parentNode.insertBefore(adminLink, profileLink.nextSibling);
            }
            adminLink.classList.remove('hidden');
        }
        
        // Ocultar buscador y carrito para administradores
        if (searchBar) searchBar.classList.add('hidden');
        if (cartIcon) cartIcon.classList.add('hidden');
        
        // Mostrar menú de administración en el header
        if (adminMenuHeader) adminMenuHeader.classList.remove('hidden');
        
        // Ocultar navegación de cliente
        if (clientNav) clientNav.classList.add('hidden');
    } else {
        // Ocultar enlace de admin si no es administrador
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            adminLink.classList.add('hidden');
        }
        
        // Mostrar buscador y carrito para clientes
        if (searchBar) searchBar.classList.remove('hidden');
        if (cartIcon) cartIcon.classList.remove('hidden');
        
        // Ocultar menú de administración en el header
        if (adminMenuHeader) adminMenuHeader.classList.add('hidden');
        
        // Mostrar navegación de cliente
        if (clientNav) clientNav.classList.remove('hidden');
    }
}

// Función legacy para compatibilidad (ahora usa AuthManager internamente)
async function updateNavbarForLoggedUser(user) {
    // Esta función se mantiene para compatibilidad pero ahora usa AuthManager
    // El AuthManager ya maneja todo automáticamente a través de sus listeners
    if (typeof authManager !== 'undefined') {
        if (user) {
            await authManager.setUser(user);
        } else {
            authManager.clearUser();
        }
    }
}

// Función para manejar el cierre de sesión
async function handleLogout(event) {
    event.preventDefault();
    
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        const result = await logoutUser();
        
        if (result.success) {
            // Limpiar AuthManager (esto notificará automáticamente a los listeners)
            if (typeof authManager !== 'undefined') {
                authManager.clearUser();
            }
            
            // Redirigir a la página principal
            window.location.href = '/';
        } else {
            alert('Error al cerrar sesión: ' + result.error);
        }
    }
}


// Función para actualizar navbar desde cache inmediatamente (antes de que se renderice)
function initNavbarFromCache() {
    if (document.body.classList.contains('admin-body')) {
        return;
    }
    
    try {
        // Cargar estado desde cache de AuthManager
        const cached = sessionStorage.getItem('authManager_cache');
        if (cached) {
            const cacheData = JSON.parse(cached);
            const maxAge = 60 * 60 * 1000; // 1 hora
            
            if (Date.now() - cacheData.timestamp < maxAge && cacheData.uid) {
                // Hay un usuario cacheado, mostrar estado de autenticado inmediatamente
                const notLoggedDiv = document.getElementById('user-not-logged');
                const loggedDiv = document.getElementById('user-logged');
                const userNameSpan = document.getElementById('user-name');
                
                if (notLoggedDiv && loggedDiv) {
                    // Ocultar no autenticado
                    notLoggedDiv.classList.add('hidden');
                    notLoggedDiv.style.setProperty('display', 'none', 'important');
                    
                    // Mostrar autenticado
                    loggedDiv.classList.remove('hidden');
                    loggedDiv.style.setProperty('display', 'flex', 'important');
                    
                    // Actualizar nombre desde cache
                    if (userNameSpan && cacheData.userData && cacheData.userData.fullName) {
                        const displayName = cacheData.userData.fullName;
                        const truncatedName = displayName.length > 15 
                            ? displayName.substring(0, 15) + '...' 
                            : displayName;
                        userNameSpan.textContent = truncatedName;
                    } else if (userNameSpan && cacheData.displayName) {
                        const truncatedName = cacheData.displayName.length > 15 
                            ? cacheData.displayName.substring(0, 15) + '...' 
                            : cacheData.displayName;
                        userNameSpan.textContent = truncatedName;
                    }
                    
                    console.log('Navbar: Inicializado desde cache - Usuario:', cacheData.email);
                }
            }
        }
    } catch (error) {
        console.warn('Error cargando navbar desde cache:', error);
    }
}

// Inicializar navbar usando AuthManager
function initNavbarWithAuthManager() {
    if (document.body.classList.contains('admin-body')) {
        return;
    }
    
    // Suscribirse a cambios de estado del AuthManager
    if (typeof authManager !== 'undefined') {
        // Obtener estado inicial inmediatamente (síncrono)
        const initialState = {
            user: authManager.getUser(),
            role: authManager.getRole(),
            userData: authManager.getUserData(),
            isAuthenticated: authManager.isAuthenticated()
        };
        
        // Actualizar navbar con estado inicial
        updateNavbarFromAuthManager(initialState);
        
        // Suscribirse a cambios futuros
        authManager.subscribe((state) => {
            console.log('Navbar: Estado actualizado desde AuthManager', state);
            updateNavbarFromAuthManager(state);
        });
    } else {
        // Si AuthManager no está disponible aún, esperar un poco
        setTimeout(initNavbarWithAuthManager, 100);
    }
}

// Inicializar navbar desde cache INMEDIATAMENTE (antes de que se renderice)
// Esto evita el "flash" de "Iniciar sesión" cuando se navega entre páginas
if (!document.body.classList.contains('admin-body')) {
    // Ejecutar inmediatamente si el DOM ya está listo
    if (document.readyState !== 'loading') {
        initNavbarFromCache();
    }
    
    // También ejecutar cuando el DOM esté listo (por si acaso)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initNavbarFromCache();
            // Luego inicializar con AuthManager para suscripciones
            setTimeout(initNavbarWithAuthManager, 50);
        });
    } else {
        // DOM ya está listo, inicializar AuthManager después de un pequeño delay
        setTimeout(initNavbarWithAuthManager, 50);
    }
}

