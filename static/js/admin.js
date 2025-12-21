// Script para el panel de administración

// Verificar que el usuario sea administrador antes de cargar
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Verificar rol primero antes de mostrar el navbar
        const userRole = await getUserRole(user.uid);
        if (userRole !== 'administrador') {
            // No es administrador, redirigir
            alert('No tienes permisos para acceder a esta página');
            window.location.href = '/';
            return;
        }
        // Es administrador, cargar datos
        await loadAdminData();
        await loadDashboardStats();
    } else {
        // No autenticado, redirigir al login
        window.location.href = '/login';
    }
});

// Función para cargar datos del dashboard
async function loadDashboardStats() {
    try {
        const currentUser = getCurrentUser();
        
        // Cargar nombre del administrador
        if (currentUser) {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const adminName = userData.fullName || currentUser.displayName || currentUser.email;
                document.getElementById('admin-name').textContent = adminName;
            } else {
                document.getElementById('admin-name').textContent = currentUser.displayName || currentUser.email;
            }
        }
        
        // Cargar total de productos
        try {
            const productsSnapshot = await db.collection('products').get();
            document.getElementById('total-productos').textContent = productsSnapshot.size;
        } catch (error) {
            console.warn('No se pudo cargar productos:', error);
            document.getElementById('total-productos').textContent = '0';
        }
        
        // Cargar total de pedidos
        try {
            const ordersSnapshot = await db.collection('orders').get();
            document.getElementById('total-pedidos').textContent = ordersSnapshot.size;
        } catch (error) {
            console.warn('No se pudo cargar pedidos:', error);
            document.getElementById('total-pedidos').textContent = '0';
        }
        
        // Cargar mensajes pendientes
        try {
            const messagesSnapshot = await db.collection('messages')
                .where('status', '==', 'pendiente')
                .get();
            document.getElementById('mensajes-pendientes').textContent = messagesSnapshot.size;
        } catch (error) {
            // Si no existe el campo status, contar todos los mensajes
            try {
                const allMessagesSnapshot = await db.collection('messages').get();
                document.getElementById('mensajes-pendientes').textContent = allMessagesSnapshot.size;
            } catch (error2) {
                console.warn('No se pudo cargar mensajes:', error2);
                document.getElementById('mensajes-pendientes').textContent = '0';
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para cargar datos del panel de administración (usuarios)
async function loadAdminData() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        let totalUsers = 0;
        let totalClientes = 0;
        let totalAdmins = 0;

        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                ...userData
            });
            totalUsers++;
            if (userData.role === 'cliente') {
                totalClientes++;
            } else if (userData.role === 'administrador') {
                totalAdmins++;
            }
        });

        // Actualizar tabla (si existe)
        const usersTableBody = document.getElementById('users-table-body');
        if (usersTableBody) {
            updateUsersTable(users);
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        showMessage('Error al cargar los datos', 'error');
    }
}

// Función para actualizar la tabla de usuarios
function updateUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const createdAt = user.createdAt 
            ? user.createdAt.toDate().toLocaleDateString('es-ES')
            : 'No disponible';
        
        const roleBadge = user.role === 'administrador'
            ? '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Administrador</span>'
            : '<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Cliente</span>';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <i class="far fa-user text-gray-600"></i>
                        </div>
                        <div class="text-sm font-medium text-gray-900">
                            ${user.fullName || 'Sin nombre'}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${user.email || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${roleBadge}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${createdAt}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${user.role !== 'administrador' 
                        ? `<button onclick="changeUserRole('${user.id}', 'administrador')" class="text-blue-600 hover:text-blue-900 mr-3">
                            <i class="fas fa-user-shield mr-1"></i>Hacer Admin
                           </button>`
                        : `<button onclick="changeUserRole('${user.id}', 'cliente')" class="text-orange-600 hover:text-orange-900">
                            <i class="fas fa-user mr-1"></i>Quitar Admin
                           </button>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

// Función para cambiar el rol de un usuario
async function changeUserRole(userId, newRole) {
    if (!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole}?`)) {
        return;
    }

    try {
        await db.collection('users').doc(userId).update({
            role: newRole
        });
        
        showMessage(`Rol actualizado a ${newRole} exitosamente`, 'success');
        loadAdminData(); // Recargar datos
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        showMessage('Error al cambiar el rol del usuario', 'error');
    }
}

// Función para mostrar mensajes
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `mb-4 p-3 rounded-lg text-sm ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    messageDiv.classList.remove('hidden');
    
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 3000);
}

// Función para cargar marcas
async function loadBrands() {
    try {
        const brandsSnapshot = await db.collection('brands').orderBy('name').get();
        const brandsList = document.getElementById('brandsList');
        
        if (!brandsList) return;
        
        if (brandsSnapshot.empty) {
            brandsList.innerHTML = '<p class="text-gray-500 text-center py-4">No hay marcas registradas</p>';
            return;
        }
        
        brandsList.innerHTML = '';
        brandsSnapshot.forEach((doc) => {
            const brand = doc.data();
            const brandItem = document.createElement('div');
            brandItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition';
            brandItem.innerHTML = `
                <span class="font-medium text-gray-800">${brand.name}</span>
            `;
            brandsList.appendChild(brandItem);
        });
    } catch (error) {
        console.error('Error al cargar marcas:', error);
        const brandsList = document.getElementById('brandsList');
        if (brandsList) {
            brandsList.innerHTML = '<p class="text-red-500 text-center py-4">Error al cargar las marcas</p>';
        }
    }
}

// Función para cargar tipos de fragancia
async function loadFragranceTypes() {
    try {
        const typesSnapshot = await db.collection('fragranceTypes').orderBy('name').get();
        const typesList = document.getElementById('fragranceTypesList');
        
        if (!typesList) return;
        
        if (typesSnapshot.empty) {
            typesList.innerHTML = '<p class="text-gray-500 text-center py-4">No hay tipos de fragancia registrados</p>';
            return;
        }
        
        typesList.innerHTML = '';
        typesSnapshot.forEach((doc) => {
            const type = doc.data();
            const typeItem = document.createElement('div');
            typeItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition';
            typeItem.innerHTML = `
                <span class="font-medium text-gray-800">${type.name}</span>
            `;
            typesList.appendChild(typeItem);
        });
    } catch (error) {
        console.error('Error al cargar tipos de fragancia:', error);
        const typesList = document.getElementById('fragranceTypesList');
        if (typesList) {
            typesList.innerHTML = '<p class="text-red-500 text-center py-4">Error al cargar los tipos</p>';
        }
    }
}

