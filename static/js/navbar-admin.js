// Script para actualizar el navbar de administrador

// Función para actualizar el nombre del usuario en el navbar de admin
async function updateAdminNavbar() {
    const currentUser = getCurrentUser();
    const adminUserName = document.getElementById('admin-user-name');
    
    if (currentUser && adminUserName) {
        try {
            // Intentar obtener el nombre completo de Firestore
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const displayName = userData.fullName || currentUser.displayName || currentUser.email || 'Mi cuenta';
                adminUserName.textContent = displayName.length > 15 
                    ? displayName.substring(0, 15) + '...' 
                    : displayName;
            } else {
                // Si no existe en Firestore, usar el displayName o email
                const displayName = currentUser.displayName || currentUser.email || 'Mi cuenta';
                adminUserName.textContent = displayName.length > 15 
                    ? displayName.substring(0, 15) + '...' 
                    : displayName;
            }
        } catch (error) {
            console.warn('Error al obtener datos del usuario:', error);
            // Usar datos básicos del usuario
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
    
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        const result = await logoutUser();
        
        if (result.success) {
            // Redirigir a la página principal
            window.location.href = '/';
        } else {
            alert('Error al cerrar sesión: ' + result.error);
        }
    }
}

// Actualizar navbar cuando Firebase esté listo
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateAdminNavbar();
        } else {
            // No autenticado, redirigir al login
            window.location.href = '/login';
        }
    });
    
    // Verificar estado inicial
    const currentUser = getCurrentUser();
    if (currentUser) {
        updateAdminNavbar();
    }
}

