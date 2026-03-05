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
        if (!currentUser) return;

        // Cargar nombre del administrador
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const adminName = userData.fullName || currentUser.displayName || currentUser.email;
                adminNameEl.textContent = adminName;
            } else {
                adminNameEl.textContent = currentUser.displayName || currentUser.email;
            }
        }

        // Cargar total de productos (solo si el elemento existe)
        const totalProdsEl = document.getElementById('total-productos');
        if (totalProdsEl) {
            try {
                const productsSnapshot = await db.collection('products').get();
                totalProdsEl.textContent = productsSnapshot.size;
            } catch (error) {
                console.warn('No se pudo cargar productos:', error);
                totalProdsEl.textContent = '0';
            }
        }

        // Cargar total de pedidos (solo si el elemento existe)
        const totalOrdersEl = document.getElementById('total-pedidos');
        if (totalOrdersEl) {
            try {
                const ordersSnapshot = await db.collection('orders').get();
                totalOrdersEl.textContent = ordersSnapshot.size;
            } catch (error) {
                console.warn('No se pudo cargar pedidos:', error);
                totalOrdersEl.textContent = '0';
            }
        }

        // Cargar mensajes pendientes (solo si el elemento existe)
        const pendingMsgsEl = document.getElementById('mensajes-pendientes');
        if (pendingMsgsEl) {
            try {
                const messagesSnapshot = await db.collection('messages')
                    .where('status', '==', 'pendiente')
                    .get();
                pendingMsgsEl.textContent = messagesSnapshot.size;
            } catch (error) {
                // Si no existe el campo status, contar todos los mensajes
                try {
                    const allMessagesSnapshot = await db.collection('messages').get();
                    pendingMsgsEl.textContent = allMessagesSnapshot.size;
                } catch (error2) {
                    console.warn('No se pudo cargar mensajes:', error2);
                    pendingMsgsEl.textContent = '0';
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas dashboard:', error);
    }
}

// Función para cargar datos del panel de administración (usuarios)
async function loadAdminData() {
    const usersTableBody = document.getElementById('users-table-body');
    if (!usersTableBody) {
        return;
    }

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
    messageDiv.className = `mb-4 p-3 rounded-lg text-sm ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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

// Función para cargar pedidos en el panel admin
async function loadAdminOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    try {
        console.log("Intentando cargar pedidos para usuario:", auth.currentUser.uid);
        const ordersSnapshot = await db.collection('orders').get();
        console.log("Pedidos cargados exitosamente, total:", ordersSnapshot.size);

        if (ordersSnapshot.empty) {
            ordersList.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-20 text-center">
                        <div class="flex flex-col items-center">
                            <div class="bg-gray-100 rounded-full p-6 mb-4">
                                <i class="fas fa-shopping-bag text-gray-400 text-4xl"></i>
                            </div>
                            <p class="text-gray-600 mb-1 text-base font-medium">No hay pedidos registrados</p>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('ordersCount').textContent = 'Mostrando 0 pedido(s)';
            return;
        }

        ordersList.innerHTML = '';
        let orderCount = 0;

        ordersSnapshot.forEach((doc) => {
            const order = doc.data();
            orderCount++;

            // Formatear fecha
            let formattedDate = 'N/A';
            if (order.createdAt) {
                const date = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                formattedDate = date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Badge de estado
            const getStatusBadge = (status) => {
                const s = (status || 'pendiente').toLowerCase();
                const classes = {
                    'pendiente': 'bg-yellow-100 text-yellow-800',
                    'procesando': 'bg-blue-100 text-blue-800',
                    'enviado': 'bg-indigo-100 text-indigo-800',
                    'entrega': 'bg-purple-100 text-purple-800',
                    'entregado': 'bg-green-100 text-green-800',
                    'cancelado': 'bg-red-100 text-red-800'
                };
                const labels = {
                    'pendiente': 'Pendiente',
                    'procesando': 'En Proceso',
                    'enviado': 'En Camino',
                    'entrega': 'En Entrega',
                    'entregado': 'Entregado',
                    'cancelado': 'Cancelado'
                };
                return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[s] || classes['pendiente']}">
                    ${labels[s] || s.charAt(0).toUpperCase() + s.slice(1)}
                </span>`;
            };

            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors duration-150';

            // Obtener información del primer producto
            let productInfo = { name: 'Sin productos', image: 'https://via.placeholder.com/50?text=N/A' };
            if (order.items && order.items.length > 0) {
                const firstItem = order.items[0];
                productInfo.name = firstItem.name || 'Producto sin nombre';
                if (firstItem.images && firstItem.images.length > 0) {
                    productInfo.image = firstItem.images[0];
                } else if (firstItem.image) {
                    productInfo.image = firstItem.image;
                }
            }

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-xs font-mono text-gray-500">#${doc.id.substring(0, 8).toUpperCase()}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img src="${productInfo.image}" alt="${productInfo.name}" 
                             class="w-10 h-10 object-cover rounded mr-3 border border-gray-100"
                             onerror="this.src='https://via.placeholder.com/50?text=N/A'">
                        <div class="text-sm font-medium text-gray-900 truncate max-w-[150px]">${productInfo.name}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${order.shippingAddress?.fullName || 'Desconocido'}</div>
                    <div class="text-xs text-gray-500">${order.shippingAddress?.phone || ''}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ${formattedDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    $${order.total ? order.total.toFixed(2) : '0.00'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select onchange="updateOrderStatus('${doc.id}', this.value)" 
                        class="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-gray-900 focus:border-gray-900">
                        <option value="pendiente" ${order.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="procesando" ${order.status === 'procesando' ? 'selected' : ''}>En Proceso</option>
                        <option value="enviado" ${order.status === 'enviado' ? 'selected' : ''}>En Camino</option>
                        <option value="entrega" ${order.status === 'entrega' ? 'selected' : ''}>En Entrega</option>
                        <option value="entregado" ${order.status === 'entregado' ? 'selected' : ''}>Entregado</option>
                        <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onclick="viewOrderDetails('${doc.id}')" class="text-gray-900 hover:text-black font-medium">
                        Ver Detalles
                    </button>
                </td>
            `;
            ordersList.appendChild(row);
        });

        document.getElementById('ordersCount').textContent = `Mostrando ${orderCount} pedido(s)`;

    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        ordersList.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-16 text-center text-red-600">
                    Error al cargar los pedidos. Por favor, intenta de nuevo.
                </td>
            </tr>
        `;
    }
}

// Función para actualizar estado de pedido
async function updateOrderStatus(orderId, newStatus) {
    // Si el nuevo estado es 'enviado', no actualizar directamente desde la tabla.
    // En su lugar, abrir el modal para requerir los datos de envío.
    if (newStatus === 'enviado') {
        showMessage('Por favor, completa los datos de envío para marcar como Enviado', 'info');
        // Abrir el modal de detalles
        await viewOrderDetails(orderId);
        // Forzar la selección de 'enviado' en el modal y mostrar campos
        const modalSelect = document.getElementById('trackingStatusSelect');
        if (modalSelect) {
            modalSelect.value = 'enviado';
            toggleShippingFields();
        }

        // Regresar el select de la tabla a su valor anterior para evitar confusión visual
        loadAdminOrders();
        return;
    }

    try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();
        const data = orderDoc.data();
        let history = data.trackingHistory || [];

        const newPoint = {
            status: newStatus,
            timestamp: new Date(),
            label: getStatusLabel(newStatus)
        };

        const existingIdx = history.findIndex(h => h.status === newStatus);
        if (existingIdx !== -1) {
            history[existingIdx] = newPoint;
        } else {
            history.push(newPoint);
        }

        await orderRef.update({
            status: newStatus,
            trackingHistory: history,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(`Estado del pedido #${orderId.substring(0, 8)} actualizado a ${newStatus}`, 'success');

        // También actualizar la barra de seguimiento si el modal está abierto
        if (selectedOrderData && selectedOrderData.id === orderId) {
            selectedOrderData.status = newStatus;
            selectedOrderData.trackingHistory = history;
            // No llamamos a updateTracking aquí porque ese guarda en DB, nosotros ya guardamos.
        }

        loadAdminOrders();
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        showMessage('Error al actualizar el estado del pedido', 'error');
    }
}

// Estado global para el pedido seleccionado en el modal
let selectedOrderData = null;

// Función para ver detalles del pedido
async function viewOrderDetails(orderId) {
    try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (!doc.exists) {
            showMessage('El pedido no existe.', 'error');
            return;
        }

        const data = doc.data();
        selectedOrderData = { id: doc.id, ...data };

        // Poblar Modal
        document.getElementById('modalOrderTitle').textContent = `Detalles del Pedido #${doc.id.substring(0, 8)}...`;
        document.getElementById('detailCustomerName').textContent = data.shippingAddress?.fullName || 'Desconocido';
        document.getElementById('detailCustomerEmail').textContent = data.userEmail || 'N/A';
        document.getElementById('detailCustomerPhone').textContent = data.shippingAddress?.phone || 'Sin teléfono';

        document.getElementById('detailAddressStreet').textContent = data.shippingAddress?.street || '';
        document.getElementById('detailAddressColonia').textContent = data.shippingAddress?.colonia || '';
        document.getElementById('detailAddressCityState').textContent = `${data.shippingAddress?.city || ''}, ${data.shippingAddress?.state || ''}`;
        document.getElementById('detailAddressZip').textContent = data.shippingAddress?.postalCode || '';

        // Poblar Items
        const itemsList = document.getElementById('detailItemsList');
        itemsList.innerHTML = '';
        let subtotal = 0;

        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const row = document.createElement('tr');
                const rowTotal = (item.price || 0) * (item.quantity || 1);
                subtotal += rowTotal;

                row.innerHTML = `
                    <td class="px-3 py-2">
                        <div class="font-medium text-gray-900">${item.name || 'Producto'}</div>
                    </td>
                    <td class="px-3 py-2 text-center text-gray-600">${item.quantity || 1}</td>
                    <td class="px-3 py-2 text-right text-gray-900">$${(item.price || 0).toFixed(2)}</td>
                `;
                itemsList.appendChild(row);
            });
        }

        document.getElementById('detailSubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('detailTotal').textContent = `$${(data.total || subtotal).toFixed(2)}`;

        // Sincronizar select y campos condicionales
        const statusSelect = document.getElementById('trackingStatusSelect');
        if (statusSelect) {
            statusSelect.value = data.status || 'pendiente';
            toggleShippingFields(); // Resetear visibilidad
        }

        // Mostrar Modal
        document.getElementById('orderDetailModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Evitar scroll de fondo

    } catch (error) {
        console.error('Error al obtener detalles del pedido:', error);
        showMessage('Error al cargar detalles del pedido', 'error');
    }
}

// Función para cerrar el modal
function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    selectedOrderData = null;
}

// Función para generar UI de la guía de envío y disparar impresión
function generateShippingGuideUI() {
    if (!selectedOrderData) return;

    const data = selectedOrderData;
    const address = data.shippingAddress || {};

    // Poblar sección de impresión
    document.getElementById('printOrderId').textContent = `#${selectedOrderData.id.substring(0, 8)}`;
    document.getElementById('printCustomerName').textContent = address.fullName || 'Desconocido';
    document.getElementById('printAddress').textContent = address.street || '';
    document.getElementById('printColonia').textContent = address.colonia || '';
    document.getElementById('printCityStateZip').textContent = `${address.city || ''}, ${address.state || ''} CP: ${address.postalCode || ''}`;
    document.getElementById('printPhone').textContent = address.phone || '';
    document.getElementById('printBarcodeId').textContent = selectedOrderData.id;

    const container = document.getElementById('shipping-guide-print');
    container.classList.remove('hidden');

    // Pequeño timeout para asegurar que el DOM se actualice antes de imprimir
    setTimeout(() => {
        window.print();
        container.classList.add('hidden');
    }, 500);
}

// Función para descargar la guía de envío como PDF profesional
async function downloadShippingGuidePDF() {
    if (!selectedOrderData) return;

    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Generando...';
    btn.disabled = true;

    try {
        const data = selectedOrderData;
        const address = data.shippingAddress || {};

        // Poblar el contenedor de la guía (asegurarse de que sea visible para la captura pero no para el usuario)
        document.getElementById('printOrderId').textContent = `#${selectedOrderData.id}`;
        document.getElementById('printCustomerName').textContent = address.fullName || 'Desconocido';
        document.getElementById('printAddress').textContent = address.street || '';
        document.getElementById('printColonia').textContent = address.colonia || '';
        document.getElementById('printCityStateZip').textContent = `${address.city || ''}, ${address.state || ''} CP: ${address.postalCode || ''}`;
        document.getElementById('printPhone').textContent = address.phone || '';
        document.getElementById('printBarcodeId').textContent = selectedOrderData.id;

        const container = document.getElementById('shipping-guide-print');
        container.classList.remove('hidden');

        // Usar html2canvas para capturar el diseño (Ajustado para Luxury Design)
        const canvas = await html2canvas(container, {
            scale: 3, // Mayor escala para nitidez extrema
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794, // Ancho estándar A4 en px a 96dpi
            windowHeight: 1123
        });

        container.classList.add('hidden');

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save(`guia_envio_${selectedOrderData.id.substring(0, 8)}.pdf`);

        showMessage('Guía descargada exitosamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showMessage('Error al generar el PDF de la guía', 'error');
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

// Funciones para manejo de UI condicional de envío
function toggleShippingFields() {
    const status = document.getElementById('trackingStatusSelect').value;
    const section = document.getElementById('shippingDetailsSection');
    if (status === 'enviado') {
        section.classList.remove('hidden');
        toggleGuideField(); // Verificar también la guía
    } else {
        section.classList.add('hidden');
    }
}

function toggleGuideField() {
    const carrier = document.getElementById('shippingCarrier').value;
    const guideContainer = document.getElementById('guideNumberContainer');
    // Guía obligatoria solo para Estafeta, DHL y otros que no sean Taxi o Entrega Personal
    if (carrier === 'Estafeta' || carrier === 'DHL' || carrier === 'Otro') {
        guideContainer.classList.remove('hidden');
    } else {
        guideContainer.classList.add('hidden');
    }
}

// Función para actualizar seguimiento desde el admin
async function updateTracking(forcedStatus = null) {
    if (!selectedOrderData) return;

    const status = forcedStatus || document.getElementById('trackingStatusSelect').value;
    const carrier = document.getElementById('shippingCarrier').value;
    const origin = document.getElementById('shippingOrigin').value || '';
    const guide = document.getElementById('shippingGuide').value || '';

    // Validación obligatoria para 'enviado'
    if (status === 'enviado') {
        if (!origin) {
            showMessage('El origen es obligatorio para el envío', 'error');
            return;
        }
        if ((carrier === 'Estafeta' || carrier === 'DHL') && !guide) {
            showMessage(`El número de guía es obligatorio para ${carrier}`, 'error');
            return;
        }
    }

    try {
        const orderRef = db.collection('orders').doc(selectedOrderData.id);
        const orderDoc = await orderRef.get();
        const data = orderDoc.data();

        let history = data.trackingHistory || [];

        // Construir ubicación descriptiva si es necesario
        let finalLocation = origin;
        if (status === 'enviado' && carrier !== 'Taxi' && carrier !== 'Personal') {
            if (guide) finalLocation = `${origin} (Vía ${carrier}, Guía: ${guide})`;
            else finalLocation = `${origin} (Vía ${carrier})`;
        } else if (status === 'enviado' && carrier === 'Taxi') {
            finalLocation = `${origin} (Vía Taxi)`;
        }

        const newPoint = {
            status: status,
            location: finalLocation,
            carrier: carrier,
            guideNumber: guide,
            timestamp: new Date(), // Usar fecha local para el historial (serverTimestamp no se permite dentro de arrays)
            label: getStatusLabel(status)
        };

        const existingIdx = history.findIndex(h => h.status === status);
        if (existingIdx !== -1) {
            history[existingIdx] = newPoint;
        } else {
            history.push(newPoint);
        }

        // Actualizar Firestore
        await orderRef.update({
            status: status,
            shippingMethod: carrier,
            trackingId: guide,
            trackingHistory: history,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar UI local
        selectedOrderData.status = status;
        selectedOrderData.trackingHistory = history;

        if (!forcedStatus) {
            showMessage('Seguimiento actualizado correctamente', 'success');
            // Limpiar campos
            document.getElementById('shippingOrigin').value = '';
            document.getElementById('shippingGuide').value = '';
        }

        loadAdminOrders();

    } catch (error) {
        console.error('Error al actualizar seguimiento:', error);
        showMessage('Error al actualizar el seguimiento', 'error');
    }
}

function getStatusLabel(status) {
    const labels = {
        'pendiente': 'Se acaba de realizar el pago',
        'procesando': 'Se está procesando y pronto será enviado',
        'enviado': 'El envío está en tránsito',
        'entrega': 'Tu paquete está en tránsito de entrega',
        'entregado': 'Tu pedido ha sido entregado correctamente',
        'cancelado': 'Pedido Cancelado'
    };
    return labels[status] || status;
}

// Exportar funciones globalmente
window.loadAdminOrders = loadAdminOrders;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailModal = closeOrderDetailModal;
window.generateShippingGuideUI = generateShippingGuideUI;
window.downloadShippingGuidePDF = downloadShippingGuidePDF;
window.updateTracking = updateTracking;
window.toggleShippingFields = toggleShippingFields;
window.toggleGuideField = toggleGuideField;
