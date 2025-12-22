// Funcionalidad del carrito de compras
// Usa Firestore para almacenar el carrito del usuario

// Obtener el carrito del usuario desde Firestore
async function getCart(userId) {
    try {
        if (typeof db === 'undefined') {
            return [];
        }

        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        if (cartDoc.exists) {
            return cartDoc.data().items || [];
        }
        return [];
    } catch (error) {
        console.error('Error getting cart:', error);
        return [];
    }
}

// Agregar producto al carrito
async function addToCart(userId, productId, productData, quantity = 1) {
    try {
        if (typeof db === 'undefined') {
            throw new Error('Firebase no está inicializado');
        }

        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        let items = [];
        if (cartDoc.exists) {
            items = cartDoc.data().items || [];
        }

        // Verificar si el producto ya está en el carrito
        const existingItemIndex = items.findIndex(item => item.productId === productId);
        
        if (existingItemIndex !== -1) {
            // Si ya existe, aumentar la cantidad
            items[existingItemIndex].quantity += quantity;
        } else {
            // Si no existe, agregarlo
            items.push({
                productId: productId,
                name: productData.name,
                brand: productData.brand,
                price: productData.price,
                image: productData.images && productData.images.length > 0 ? productData.images[0] : '',
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        // Guardar en Firestore
        await cartRef.set({
            items: items,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Actualizar el contador del carrito
        updateCartCount(userId);
        
        return true;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
}

// Eliminar producto del carrito
async function removeFromCart(userId, productId) {
    try {
        if (typeof db === 'undefined') {
            throw new Error('Firebase no está inicializado');
        }

        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        if (!cartDoc.exists) {
            return false;
        }

        let items = cartDoc.data().items || [];
        items = items.filter(item => item.productId !== productId);

        await cartRef.set({
            items: items,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Actualizar el contador del carrito
        updateCartCount(userId);
        
        return true;
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
}

// Actualizar cantidad de un producto en el carrito
async function updateCartItemQuantity(userId, productId, quantity) {
    try {
        if (typeof db === 'undefined') {
            throw new Error('Firebase no está inicializado');
        }

        if (quantity <= 0) {
            return await removeFromCart(userId, productId);
        }

        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await cartRef.get();
        
        if (!cartDoc.exists) {
            return false;
        }

        let items = cartDoc.data().items || [];
        const itemIndex = items.findIndex(item => item.productId === productId);
        
        if (itemIndex !== -1) {
            items[itemIndex].quantity = quantity;
            await cartRef.set({
                items: items,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Actualizar el contador del carrito
            updateCartCount(userId);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
}

// Limpiar el carrito
async function clearCart(userId) {
    try {
        if (typeof db === 'undefined') {
            throw new Error('Firebase no está inicializado');
        }

        const cartRef = db.collection('carts').doc(userId);
        await cartRef.set({
            items: [],
            updatedAt: new Date().toISOString()
        }, { merge: true });

        // Actualizar el contador del carrito
        updateCartCount(userId);
        
        return true;
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }
}

// Actualizar el contador del carrito en el navbar
async function updateCartCount(userId) {
    try {
        if (typeof db === 'undefined') {
            return;
        }

        const items = await getCart(userId);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Actualizar el badge del carrito
        const cartBadge = document.querySelector('#cart-icon .absolute');
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            if (totalItems === 0) {
                cartBadge.style.display = 'none';
            } else {
                cartBadge.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Inicializar el contador del carrito cuando el usuario está autenticado
function initCartCount() {
    if (typeof auth === 'undefined') {
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            updateCartCount(user.uid);
        } else {
            // Si no hay usuario, ocultar el badge
            const cartBadge = document.querySelector('#cart-icon .absolute');
            if (cartBadge) {
                cartBadge.textContent = '0';
                cartBadge.style.display = 'none';
            }
        }
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartCount);
} else {
    initCartCount();
}

