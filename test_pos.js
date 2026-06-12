        // ─── Estado global ───────────────────────────────────────────────
        let allProducts = [];
        let cart = [];       // [{productId, name, price, qty, image}]
        let posTotal = 0;

        // Placeholder local sin internet
        const PLACEHOLDER_IMG = `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23f3f4f6%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2212%22 fill=%22%239ca3af%22%3ESin imagen%3C/text%3E%3C/svg%3E`;

        // ─── Inicialización ──────────────────────────────────────────────
        document.addEventListener('DOMContentLoaded', () => {
            auth.onAuthStateChanged(async (user) => {
                if (!user) { window.location.replace('/login'); return; }
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists || userDoc.data().role !== 'administrador') {
                    window.location.replace('/'); return;
                }
                loadProducts();
            });
        });

        // ─── Cargar productos desde Firestore ────────────────────────────
        async function loadProducts() {
            try {
                const snap = await db.collection('products').get();
                let products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Ordenar en memoria para no perder productos que no tengan el campo 'name'
                products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                allProducts = products;
                renderProducts(allProducts);
            } catch (e) {
                document.getElementById('productsGrid').innerHTML = `
                    <div class="col-span-full text-center py-16 text-red-400">
                        <i class="fas fa-exclamation-circle text-3xl mb-3"></i>
                        <p class="text-sm">Error al cargar productos</p>
                    </div>`;
            }
        }

        // ─── Renderizar grid de productos ────────────────────────────────
        function renderProducts(products) {
            const grid = document.getElementById('productsGrid');
            document.getElementById('productsCountLabel').textContent = `${products.length} producto(s)`;

            if (products.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center py-16 text-gray-400">
                        <i class="fas fa-search text-3xl mb-3"></i>
                        <p class="text-sm font-medium">Sin resultados</p>
                    </div>`;
                return;
            }

            function escapeHTML(str) {
                return (str || '').toString()
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }

            grid.innerHTML = products.map(p => {
                const img = (p.images && p.images[0]) ? p.images[0] : PLACEHOLDER_IMG;
                const price = (p.price || p.precio || 0);
                const inStock = p.stock === undefined || p.stock > 0;
                
                const safeName = encodeURIComponent(p.name || 'Producto').replace(/'/g, "%27");
                const displayName = escapeHTML(p.name || 'Sin nombre');
                const displayBrand = escapeHTML(p.brand || p.marca || '');
                const safeImg = escapeHTML(img);
                
                return `
                <div class="product-card bg-white rounded-xl border border-gray-100 overflow-hidden ${!inStock ? 'opacity-50' : ''}"
                     onclick="${inStock ? `addToCart('${p.id}', decodeURIComponent('${safeName}'), ${price}, '${safeImg}')` : ''}">
                    <div class="relative">
                        <img src="${safeImg}" alt="${displayName}"
                            class="w-full h-32 object-cover"
                            onerror="this.src=PLACEHOLDER_IMG">
                        ${!inStock ? '<div class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center"><span class="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded">Sin stock</span></div>' : ''}
                    </div>
                    <div class="p-2.5">
                        <p class="text-xs font-bold text-gray-900 truncate leading-tight">${displayName}</p>
                        <p class="text-[10px] text-gray-400 truncate">${displayBrand}</p>
                        <p class="text-sm font-black text-gray-900 mt-1">$${price.toFixed(2)}</p>
                    </div>
                </div>`;
            }).join('');
        }

        // ─── Filtrar productos ───────────────────────────────────────────
        function normalizeText(text) {
            return String(text || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        }

        function filterProducts(query) {
            const cat = document.getElementById('categoryFilter').value.toLowerCase();
            const searchTerms = normalizeText(query).split(' ').filter(t => t.trim().length > 0);
            
            const filtered = allProducts.filter(p => {
                const productText = normalizeText(p.name + ' ' + (p.brand || p.marca || ''));
                
                // Buscar que TODOS los términos ingresados existan en el texto del producto (Buscador Inteligente)
                const matchText = searchTerms.length === 0 || searchTerms.every(term => productText.includes(term));
                
                const categoryStr = String(p.category || p.categoria || p.tipo || '').toLowerCase();
                const isDecant = p.isDecant === true || categoryStr.includes('decant');
                const isSpray = p.isSpray === true || categoryStr.includes('spray');
                const isFragancia = !isDecant && !isSpray;

                const matchCat = !cat || 
                    (cat === 'decant' && isDecant) ||
                    (cat === 'spray' && isSpray) ||
                    (cat === 'fragancia' && isFragancia);

                return matchText && matchCat;
            });
            renderProducts(filtered);
        }

        // ─── Agregar al carrito ──────────────────────────────────────────
        function addToCart(productId, name, price, image) {
            const existing = cart.find(i => i.productId === productId);
            if (existing) {
                existing.qty++;
            } else {
                cart.push({ productId, name, price, qty: 1, image });
            }
            renderCart();

            // Feedback visual rápido
            const btn = document.getElementById('btnCobrar');
            btn.classList.add('ring-2', 'ring-green-400');
            setTimeout(() => btn.classList.remove('ring-2', 'ring-green-400'), 400);
        }

        // ─── Cambiar cantidad ────────────────────────────────────────────
        function changeQty(productId, delta) {
            const item = cart.find(i => i.productId === productId);
            if (!item) return;
            item.qty += delta;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.productId !== productId);
            }
            renderCart();
        }

        // ─── Renderizar carrito ──────────────────────────────────────────
        function renderCart() {
            const list = document.getElementById('cartItemsList');
            const empty = document.getElementById('cartEmpty');

            if (cart.length === 0) {
                empty.classList.remove('hidden');
                list.querySelectorAll('.cart-item').forEach(el => el.remove());
                updateTotals();
                return;
            }
            empty.classList.add('hidden');

            // Reconstruir items
            list.querySelectorAll('.cart-item').forEach(el => el.remove());
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item cart-item-enter flex items-center gap-3 py-3 border-b border-gray-50 last:border-0';
                div.innerHTML = `
                    <img src="${item.image}" alt="${item.name}"
                        class="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                        onerror="this.onerror=null;this.src=PLACEHOLDER_IMG">
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-gray-900 truncate">${item.name}</p>
                        <p class="text-xs text-gray-400">$${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <button onclick="changeQty('${item.productId}', -1)" class="qty-btn bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600">−</button>
                        <span class="text-sm font-bold w-5 text-center">${item.qty}</span>
                        <button onclick="changeQty('${item.productId}', +1)" class="qty-btn bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600">+</button>
                    </div>
                    <span class="text-xs font-black text-gray-900 w-14 text-right">$${(item.price * item.qty).toFixed(2)}</span>
                `;
                list.appendChild(div);
            });
            updateTotals();
        }

        // ─── Actualizar totales ──────────────────────────────────────────
        function updateTotals() {
            const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
            const count = cart.reduce((s, i) => s + i.qty, 0);
            posTotal = subtotal;

            document.getElementById('posSubtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('posTotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('posItemCount').textContent = count;

            const btn = document.getElementById('btnCobrar');
            btn.disabled = cart.length === 0;
        }

        // ─── Vaciar carrito ──────────────────────────────────────────────
        function clearCart() {
            cart = [];
            renderCart();
        }

        // ─── Modal de pago ───────────────────────────────────────────────
        function openPaymentModal() {
            if (cart.length === 0) return;
            document.getElementById('modalTotalDisplay').textContent = `$${posTotal.toFixed(2)}`;
            document.getElementById('cashReceivedInput').value = '';
            document.getElementById('changeSection').classList.add('hidden');
            document.getElementById('btnCompleteSale').disabled = true;
            document.getElementById('paymentModal').classList.remove('hidden');
            document.getElementById('paymentModal').classList.add('flex');
            setTimeout(() => document.getElementById('cashReceivedInput').focus(), 100);
        }

        function closePaymentModal() {
            document.getElementById('paymentModal').classList.add('hidden');
            document.getElementById('paymentModal').classList.remove('flex');
        }

        // ─── Calcular cambio ─────────────────────────────────────────────
        function calculateChange() {
            const received = parseFloat(document.getElementById('cashReceivedInput').value) || 0;
            const total = posTotal;
            const changeSection = document.getElementById('changeSection');
            const changeDisplay = document.getElementById('changeDisplay');
            const changeAmount = document.getElementById('changeAmount');
            const changeLabel = document.getElementById('changeLabel');
            const btnComplete = document.getElementById('btnCompleteSale');

            if (received === 0) {
                changeSection.classList.add('hidden');
                btnComplete.disabled = true;
                return;
            }

            changeSection.classList.remove('hidden');
            const change = received - total;

            if (change < 0) {
                // Falta dinero
                changeDisplay.className = 'rounded-xl p-4 text-center border-2 border-red-200 bg-red-50';
                changeLabel.className = 'text-sm font-semibold text-red-600 mb-1';
                changeLabel.textContent = 'Falta para completar';
                changeAmount.className = 'text-3xl font-black text-red-600';
                changeAmount.textContent = `$${Math.abs(change).toFixed(2)}`;
                btnComplete.disabled = true;
            } else if (change === 0) {
                // Exacto
                changeDisplay.className = 'rounded-xl p-4 text-center border-2 border-indigo-200 bg-indigo-50';
                changeLabel.className = 'text-sm font-semibold text-indigo-600 mb-1';
                changeLabel.textContent = '¡Pago exacto!';
                changeAmount.className = 'text-3xl font-black text-indigo-600';
                changeAmount.textContent = '$0.00';
                btnComplete.disabled = false;
            } else {
                // Hay cambio
                changeDisplay.className = 'rounded-xl p-4 text-center border-2 border-green-200 bg-green-50';
                changeLabel.className = 'text-sm font-semibold text-green-700 mb-1';
                changeLabel.textContent = 'Cambio a entregar';
                changeAmount.className = 'text-3xl font-black text-green-600';
                changeAmount.textContent = `$${change.toFixed(2)}`;
                btnComplete.disabled = false;
            }
        }

        // ─── Botones rápidos de monto ────────────────────────────────────
        function setQuickAmount(amount) {
            document.getElementById('cashReceivedInput').value = amount;
            calculateChange();
        }

        function setExactAmount() {
            document.getElementById('cashReceivedInput').value = posTotal.toFixed(2);
            calculateChange();
        }

        // ─── Completar venta ─────────────────────────────────────────────
        async function completeSale() {
            const received = parseFloat(document.getElementById('cashReceivedInput').value) || 0;
            const change = received - posTotal;
            const btn = document.getElementById('btnCompleteSale');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Procesando...';

            try {
                // Registrar venta en Firestore
                const saleData = {
                    items: cart.map(i => ({
                        productId: i.productId,
                        name: i.name,
                        price: i.price,
                        quantity: i.qty,
                        subtotal: i.price * i.qty,
                        images: [i.image]
                    })),
                    total: posTotal,
                    cashReceived: received,
                    change: Math.max(change, 0),
                    paymentMethod: 'cash',
                    status: 'entregado',
                    channel: 'pos',  // indica que es venta en mostrador
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    trackingHistory: [{
                        status: 'entregado',
                        label: 'Venta directa en mostrador (POS)',
                        timestamp: new Date().toISOString()
                    }]
                };

                await db.collection('orders').add(saleData);

                // Llenar modal de éxito
                const changeStr = `$${Math.max(change, 0).toFixed(2)}`;
                document.getElementById('successTotal').textContent = `$${posTotal.toFixed(2)}`;
                document.getElementById('successChangeAmount').textContent = changeStr;

                const successChangeSummary = document.getElementById('successChangeSummary');
                if (change > 0) {
                    successChangeSummary.classList.remove('hidden');
                } else {
                    successChangeSummary.classList.add('hidden');
                }

                document.getElementById('successItemsSummary').innerHTML = cart.map(i =>
                    `<div class="flex justify-between"><span>${i.name} x${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`
                ).join('');

                closePaymentModal();
                document.getElementById('successModal').classList.remove('hidden');
                document.getElementById('successModal').classList.add('flex');

            } catch (error) {
                console.error('Error al registrar venta:', error);
                alert('Error al registrar la venta. Intenta de nuevo.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check mr-1"></i> Confirmar Venta';
            }
        }

        // ─── Cerrar modal de éxito / nueva venta ─────────────────────────
        function closeSuccessModal() {
            document.getElementById('successModal').classList.add('hidden');
            document.getElementById('successModal').classList.remove('flex');
            clearCart();
        }
