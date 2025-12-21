// Script para actualizar el navbar según el estado de autenticación

// Función para mostrar el navbar después de verificar el rol
// Solo para navbar normal, no para admin
function showNavbar() {
    if (document.body.classList.contains('admin-body')) {
        return; // No hacer nada en páginas de admin
    }
    const header = document.getElementById('main-header');
    const nav = document.getElementById('main-nav');
    if (header) {
        header.style.opacity = '1';
        header.style.transition = 'opacity 0.3s ease';
    }
    if (nav) {
        nav.style.opacity = '1';
        nav.style.transition = 'opacity 0.3s ease';
    }
}

// Función para actualizar el navbar cuando el usuario está autenticado
// Solo para navbar normal, no para admin
async function updateNavbarForLoggedUser(user) {
    // No ejecutar en páginas de admin
    if (document.body.classList.contains('admin-body')) {
        return;
    }
    
    const notLoggedDiv = document.getElementById('user-not-logged');
    const notLoggedMenu = document.getElementById('user-not-logged-menu');
    const loggedDiv = document.getElementById('user-logged');
    const loggedMenu = document.getElementById('user-logged-menu');
    const userNameSpan = document.getElementById('user-name');
    
    if (user) {
        // Ocultar elementos de no autenticado
        if (notLoggedDiv) notLoggedDiv.classList.add('hidden');
        if (notLoggedMenu) notLoggedMenu.classList.add('hidden');
        
        // Mostrar elementos de autenticado
        if (loggedDiv) loggedDiv.classList.remove('hidden');
        if (loggedMenu) loggedMenu.classList.remove('hidden');
        
        // Actualizar nombre de usuario
        if (userNameSpan) {
            const displayName = user.displayName || user.email || 'Mi cuenta';
            userNameSpan.textContent = displayName.length > 15 
                ? displayName.substring(0, 15) + '...' 
                : displayName;
        }
        
        // Actualizar menú móvil de usuario
        const mobileUserNotLogged = document.getElementById('mobile-user-not-logged');
        const mobileUserLogged = document.getElementById('mobile-user-logged');
        if (mobileUserNotLogged) mobileUserNotLogged.classList.add('hidden');
        if (mobileUserLogged) mobileUserLogged.classList.remove('hidden');
        
        // Verificar si es administrador y actualizar navbar
        try {
            const userRole = await getUserRole(user.uid);
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
            
            // Mostrar el navbar después de configurar todo
            showNavbar();
        } catch (error) {
            console.warn('Error al verificar rol:', error);
            // Mostrar navbar de todas formas si hay error
            showNavbar();
        }
    } else {
        // Ocultar elementos de autenticado
        if (loggedDiv) loggedDiv.classList.add('hidden');
        if (loggedMenu) loggedMenu.classList.add('hidden');
        
        // Mostrar elementos de no autenticado
        if (notLoggedDiv) notLoggedDiv.classList.remove('hidden');
        if (notLoggedMenu) notLoggedMenu.classList.remove('hidden');
        
        // Actualizar menú móvil de usuario
        const mobileUserNotLogged = document.getElementById('mobile-user-not-logged');
        const mobileUserLogged = document.getElementById('mobile-user-logged');
        if (mobileUserNotLogged) mobileUserNotLogged.classList.remove('hidden');
        if (mobileUserLogged) mobileUserLogged.classList.add('hidden');
        
        // Ocultar enlace de admin
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            adminLink.classList.add('hidden');
        }
        
        // Mostrar elementos de cliente por defecto
        const searchBar = document.getElementById('search-bar');
        const cartIcon = document.getElementById('cart-icon');
        const clientNav = document.getElementById('client-nav');
        const adminMenuHeader = document.getElementById('admin-menu-header');
        
        if (searchBar) searchBar.classList.remove('hidden');
        if (cartIcon) cartIcon.classList.remove('hidden');
        if (clientNav) clientNav.classList.remove('hidden');
        if (adminMenuHeader) adminMenuHeader.classList.add('hidden');
        
        // Mostrar el navbar después de configurar todo
        showNavbar();
    }
}

// Función para manejar el cierre de sesión
async function handleLogout(event) {
    event.preventDefault();
    
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        const result = await logoutUser();
        
        if (result.success) {
            // Actualizar navbar
            updateNavbarForLoggedUser(null);
            
            // Redirigir a la página principal
            window.location.href = '/';
        } else {
            alert('Error al cerrar sesión: ' + result.error);
        }
    }
}

// Observador de estado de autenticación para actualizar el navbar
// NO ejecutar en páginas de admin (tienen su propio navbar)
if (typeof auth !== 'undefined' && !document.body.classList.contains('admin-body')) {
    // Verificar estado inicial primero (más rápido)
    const currentUser = getCurrentUser();
    if (currentUser) {
        updateNavbarForLoggedUser(currentUser);
    } else {
        // Si no hay usuario, mostrar navbar de no autenticado
        updateNavbarForLoggedUser(null);
    }
    
    // Observador para cambios futuros
    auth.onAuthStateChanged((user) => {
        // Solo actualizar si no estamos en una página de admin
        if (!document.body.classList.contains('admin-body')) {
            updateNavbarForLoggedUser(user);
        }
    });
} else if (typeof auth === 'undefined' && !document.body.classList.contains('admin-body')) {
    // Si Firebase no está disponible, mostrar navbar por defecto después de un tiempo
    setTimeout(() => {
        showNavbar();
    }, 1000);
}

