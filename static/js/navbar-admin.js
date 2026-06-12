// Script para actualizar el navbar de administrador

// Bandera para evitar bucle en redirección al cerrar sesión
let isLoggingOut = false;

// Función para actualizar el nombre del usuario en el navbar de admin
async function updateAdminNavbar() {
    const currentUser = getCurrentUser();
    const adminUserName = document.getElementById('admin-user-name');
    
    if (currentUser && adminUserName) {
        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const displayName = userData.fullName || currentUser.displayName || currentUser.email || 'Mi cuenta';
                adminUserName.textContent = displayName.length > 15 
                    ? displayName.substring(0, 15) + '...' 
                    : displayName;
            } else {
                const displayName = currentUser.displayName || currentUser.email || 'Mi cuenta';
                adminUserName.textContent = displayName.length > 15 
                    ? displayName.substring(0, 15) + '...' 
                    : displayName;
            }
        } catch (error) {
            console.warn('Error al obtener datos del usuario:', error);
            const displayName = currentUser.displayName || currentUser.email || 'Mi cuenta';
            adminUserName.textContent = displayName.length > 15 
                ? displayName.substring(0, 15) + '...' 
                : displayName;
        }
    }
}

// Función para manejar el cierre de sesión
async function handleLogout(event) {
    event.preventDefault();
    
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) return;

    try {
        isLoggingOut = true;

        // Cerrar sesión en Firebase
        if (typeof auth !== 'undefined') {
            await auth.signOut();
        }

        // Redirigir al inicio
        window.location.replace('/');
    } catch (error) {
        isLoggingOut = false;
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión. Inténtalo de nuevo.');
    }
}

// Observador de estado de autenticación para páginas admin
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateAdminNavbar();
        } else {
            // Solo redirigir a login si la página sigue activa
            // (no redirigir si ya se está haciendo el logout manual con el modal)
            if (!window._loggingOut) {
                window.location.replace('/login');
            }
        }
    });
}


