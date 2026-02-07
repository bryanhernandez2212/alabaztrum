let allProducts = [];
let allBrands = [];
let activeFilters = {
    gender: [],
    brand: []
};

// Cargar productos (solo sprays)
async function loadProducts() {
    try {
        if (typeof db === 'undefined') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    loadProducts().then(resolve);
                }, 500);
            });
        }

        // Cargar todos los productos y filtrar por tipo de fragancia "sprays" o "Sprays"
        const productsSnapshot = await db.collection('products').orderBy('name').get();
        
        allProducts = [];
        const brandsSet = new Set();
        
        productsSnapshot.forEach((doc) => {
            const product = doc.data();
            // Filtrar productos que tengan fragranceType igual a "sprays" o "Sprays" (case insensitive)
            const fragranceType = product.fragranceType ? product.fragranceType.toLowerCase() : '';
            if (fragranceType === 'sprays') {
                allProducts.push({
                    id: doc.id,
                    ...product
                });
                
                if (product.brand) brandsSet.add(product.brand);
            }
        });

        allBrands = Array.from(brandsSet).sort();
        loadFilters();
        displayProducts();
    } catch (error) {
        const unauth = (typeof auth !== 'undefined') ? (auth.currentUser === null) : true;
        const permErr = error && (error.code === 'permission-denied' || (String(error).toLowerCase().includes('insufficient permissions')));
        const container = document.getElementById('products-container');
        if (!container) return;
        if (unauth && permErr) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-gray-600 mb-4">Necesitas iniciar sesión para ver productos.</p>
                    <a href="/login" class="inline-block px-4 py-2 bg-gray-900 text-white rounded-md">Iniciar sesión</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="flex flex-col items-center">
                        <div class="bg-red-100 rounded-full p-4 mb-3">
                            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                        </div>
                        <p class="text-red-600 font-medium mb-1">Error al cargar productos</p>
                        <p class="text-gray-500 text-sm">Por favor, intenta recargar la página</p>
                    </div>
                </div>
            `;
        }
    }
}

// Cargar filtros
function loadFilters() {
    // Cargar marcas (desktop)
    const brandsContainer = document.getElementById('brands-filter');
    if (brandsContainer) {
        if (allBrands.length > 0) {
            brandsContainer.innerHTML = allBrands.map(brand => `
                <label class="flex items-center cursor-pointer">
                    <input type="checkbox" name="brand" value="${brand}" class="mr-2 rounded border-gray-300 text-gray-900 focus:ring-gray-900 filter-checkbox">
                    <span class="text-sm text-gray-700">${brand}</span>
                </label>
            `).join('');
        } else {
            brandsContainer.innerHTML = '<div class="text-gray-400 text-sm">No hay marcas disponibles</div>';
        }
    }

    // Cargar marcas (móvil)
    const brandsContainerMobile = document.getElementById('brands-filter-mobile');
    if (brandsContainerMobile) {
        if (allBrands.length > 0) {
            brandsContainerMobile.innerHTML = allBrands.map(brand => `
                <label class="flex items-center cursor-pointer py-2">
                    <input type="checkbox" name="brand-mobile" value="${brand}" class="mr-3 w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 filter-checkbox-mobile">
                    <span class="text-base text-gray-700">${brand}</span>
                </label>
            `).join('');
        } else {
            brandsContainerMobile.innerHTML = '<div class="text-gray-400 text-base">No hay marcas disponibles</div>';
        }
    }

    // Agregar event listeners a los checkboxes
    document.querySelectorAll('.filter-checkbox, .filter-checkbox-mobile').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            syncCheckboxes(this);
            updateFilters();
        });
    });

    // Event listener para los checkboxes de género (desktop y móvil)
    document.querySelectorAll('input[name="gender"], input[name="gender-mobile"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const isMobile = this.name === 'gender-mobile';
            const otherName = isMobile ? 'gender' : 'gender-mobile';
            
            if (this.value === 'all' && this.checked) {
                document.querySelectorAll(`input[name="${this.name}"]:not([value="all"])`).forEach(cb => cb.checked = false);
                document.querySelectorAll(`input[name="${otherName}"]:not([value="all"])`).forEach(cb => cb.checked = false);
                const allCheckbox = document.querySelector(`input[name="${otherName}"][value="all"]`);
                if (allCheckbox) allCheckbox.checked = true;
            } else if (this.value !== 'all' && this.checked) {
                document.querySelector(`input[name="${this.name}"][value="all"]`).checked = false;
                const otherAllCheckbox = document.querySelector(`input[name="${otherName}"][value="all"]`);
                if (otherAllCheckbox) otherAllCheckbox.checked = false;
                const otherCheckbox = document.querySelector(`input[name="${otherName}"][value="${this.value}"]`);
                if (otherCheckbox) otherCheckbox.checked = true;
            }
            updateFilters();
        });
    });
}

// Sincronizar checkboxes entre desktop y móvil
function syncCheckboxes(checkbox) {
    const name = checkbox.name;
    const value = checkbox.value;
    const isChecked = checkbox.checked;
    
    if (name.includes('-mobile')) {
        const desktopName = name.replace('-mobile', '');
        const desktopCheckbox = document.querySelector(`input[name="${desktopName}"][value="${value}"]`);
        if (desktopCheckbox) {
            desktopCheckbox.checked = isChecked;
        }
    } else {
        const mobileName = name + '-mobile';
        const mobileCheckbox = document.querySelector(`input[name="${mobileName}"][value="${value}"]`);
        if (mobileCheckbox) {
            mobileCheckbox.checked = isChecked;
        }
    }
}

// Actualizar filtros activos
function updateFilters() {
    const genderCheckboxes = document.querySelectorAll('input[name="gender"]:checked, input[name="gender-mobile"]:checked');
    activeFilters.gender = [];
    genderCheckboxes.forEach(cb => {
        if (cb.value !== 'all') {
            activeFilters.gender.push(cb.value);
        }
    });

    const brandCheckboxes = document.querySelectorAll('input[name="brand"]:checked, input[name="brand-mobile"]:checked');
    activeFilters.brand = [];
    brandCheckboxes.forEach(cb => {
        activeFilters.brand.push(cb.value);
    });

    displayProducts();
}

// Mostrar productos
function displayProducts() {
    const container = document.getElementById('products-container');
    
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="flex flex-col items-center">
                    <div class="bg-gray-100 rounded-full p-4 mb-3">
                        <i class="fas fa-inbox text-gray-400 text-2xl"></i>
                    </div>
                    <p class="text-gray-600 font-medium mb-1">No hay sprays disponibles</p>
                    <p class="text-gray-500 text-sm">Vuelve pronto para ver nuestros sprays</p>
                </div>
            </div>
        `;
        return;
    }

    // Filtrar productos
    let filteredProducts = allProducts.filter(product => {
        // Filtro por género
        if (activeFilters.gender.length > 0) {
            if (!activeFilters.gender.includes(product.gender)) {
                return false;
            }
        }

        // Filtro por marca
        if (activeFilters.brand.length > 0) {
            if (!product.brand || !activeFilters.brand.includes(product.brand)) {
                return false;
            }
        }

        return true;
    });

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="flex flex-col items-center">
                    <div class="bg-gray-100 rounded-full p-4 mb-3">
                        <i class="fas fa-search text-gray-400 text-2xl"></i>
                    </div>
                    <p class="text-gray-600 font-medium mb-1">No se encontraron sprays</p>
                    <p class="text-gray-500 text-sm">Intenta con otro filtro</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredProducts.map(product => {
        const imageUrl = product.images && product.images.length > 0 
            ? product.images[0] 
            : 'https://via.placeholder.com/300x300?text=No+Image';
        
        const genderBadge = product.gender === 'hombre' 
            ? '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">Hombre</span>'
            : '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">Mujer</span>';
        
        const sprayBadge = product.fragranceType && product.fragranceType.toLowerCase() === 'sprays'
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">Spray</span>`
            : '';

        return `
            <a href="/producto/${product.id}" class="relative bg-white rounded-xl shadow-sm border border-gray-200 ring-1 ring-gray-100 hover:ring-gray-300 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full block group">
                <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900"></div>
                <div class="w-full overflow-hidden flex-shrink-0 relative" style="height: 250px; background: linear-gradient(to bottom, #fafafa, #f5f5f5);">
                    <img src="${imageUrl}" alt="${product.name || ''}" class="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                </div>
                <div class="p-5 flex flex-col flex-grow bg-white" style="min-height: 140px;">
                    ${product.brand ? `<p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 line-clamp-1">${product.brand}</p>` : ''}
                    <h3 class="text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug tracking-tight group-hover:text-gray-700 transition-colors">${product.name || 'Sin nombre'}</h3>
                    <div class="flex items-center gap-2 mb-4 flex-wrap">
                        ${genderBadge}
                        ${sprayBadge}
                    </div>
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <span class="text-xl font-bold text-gray-900">$${product.price ? product.price.toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

// Función para abrir panel de filtros móvil
function openMobileFilters() {
    const panel = document.getElementById('mobile-filters-panel');
    const overlay = document.getElementById('mobile-filters-overlay');
    if (panel) panel.classList.remove('hidden');
    if (overlay) overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Función para cerrar panel de filtros móvil
function closeMobileFilters() {
    const panel = document.getElementById('mobile-filters-panel');
    const overlay = document.getElementById('mobile-filters-overlay');
    if (panel) panel.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// Limpiar y resetear el estado de la página
function resetPageState() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
}

// Cargar productos al iniciar
function initializePage() {
    resetPageState();
    
    if (typeof db !== 'undefined') {
        setTimeout(() => {
            loadProducts();
        }, 100);
    } else {
        setTimeout(() => {
            if (typeof db !== 'undefined') {
                loadProducts();
            } else {
                setTimeout(initializePage, 500);
            }
        }, 500);
    }
}

// Inicialización cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        resetPageState();
        
        // Toggle del panel de filtros móvil
        const mobileFiltersToggle = document.getElementById('mobile-filters-toggle');
        if (mobileFiltersToggle) {
            mobileFiltersToggle.addEventListener('click', openMobileFilters);
        }
        
        const mobileFiltersClose = document.getElementById('mobile-filters-close');
        if (mobileFiltersClose) {
            mobileFiltersClose.addEventListener('click', closeMobileFilters);
        }

        // Hacer funciones globales
        window.openMobileFilters = openMobileFilters;
        window.closeMobileFilters = closeMobileFilters;

        // Limpiar filtros (desktop)
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', function() {
                document.querySelectorAll('.filter-checkbox, .filter-checkbox-mobile').forEach(cb => cb.checked = false);
                document.querySelectorAll('input[name="gender"], input[name="gender-mobile"]').forEach(cb => cb.checked = false);
                const allGenderDesktop = document.querySelector('input[name="gender"][value="all"]');
                const allGenderMobile = document.querySelector('input[name="gender-mobile"][value="all"]');
                if (allGenderDesktop) allGenderDesktop.checked = true;
                if (allGenderMobile) allGenderMobile.checked = true;
                
                activeFilters = {
                    gender: [],
                    brand: []
                };
                
                displayProducts();
            });
        }

        // Limpiar filtros (móvil)
        const clearFiltersMobile = document.getElementById('clear-filters-mobile');
        if (clearFiltersMobile) {
            clearFiltersMobile.addEventListener('click', function() {
                document.querySelectorAll('.filter-checkbox, .filter-checkbox-mobile').forEach(cb => cb.checked = false);
                document.querySelectorAll('input[name="gender"], input[name="gender-mobile"]').forEach(cb => cb.checked = false);
                const allGenderDesktop = document.querySelector('input[name="gender"][value="all"]');
                const allGenderMobile = document.querySelector('input[name="gender-mobile"][value="all"]');
                if (allGenderDesktop) allGenderDesktop.checked = true;
                if (allGenderMobile) allGenderMobile.checked = true;
                
                activeFilters = {
                    gender: [],
                    brand: []
                };
                
                displayProducts();
            });
        }
        
        setTimeout(initializePage, 50);
    });
} else {
    resetPageState();
    
    // Toggle del panel de filtros móvil
    const mobileFiltersToggle = document.getElementById('mobile-filters-toggle');
    if (mobileFiltersToggle) {
        mobileFiltersToggle.addEventListener('click', openMobileFilters);
    }
    
    const mobileFiltersClose = document.getElementById('mobile-filters-close');
    if (mobileFiltersClose) {
        mobileFiltersClose.addEventListener('click', closeMobileFilters);
    }

    // Hacer funciones globales
    window.openMobileFilters = openMobileFilters;
    window.closeMobileFilters = closeMobileFilters;

    // Limpiar filtros (desktop)
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
        clearFilters.addEventListener('click', function() {
            document.querySelectorAll('.filter-checkbox, .filter-checkbox-mobile').forEach(cb => cb.checked = false);
            document.querySelectorAll('input[name="gender"], input[name="gender-mobile"]').forEach(cb => cb.checked = false);
            const allGenderDesktop = document.querySelector('input[name="gender"][value="all"]');
            const allGenderMobile = document.querySelector('input[name="gender-mobile"][value="all"]');
            if (allGenderDesktop) allGenderDesktop.checked = true;
            if (allGenderMobile) allGenderMobile.checked = true;
            
            activeFilters = {
                gender: [],
                brand: []
            };
            
            displayProducts();
        });
    }

    // Limpiar filtros (móvil)
    const clearFiltersMobile = document.getElementById('clear-filters-mobile');
    if (clearFiltersMobile) {
        clearFiltersMobile.addEventListener('click', function() {
            document.querySelectorAll('.filter-checkbox, .filter-checkbox-mobile').forEach(cb => cb.checked = false);
            document.querySelectorAll('input[name="gender"], input[name="gender-mobile"]').forEach(cb => cb.checked = false);
            const allGenderDesktop = document.querySelector('input[name="gender"][value="all"]');
            const allGenderMobile = document.querySelector('input[name="gender-mobile"][value="all"]');
            if (allGenderDesktop) allGenderDesktop.checked = true;
            if (allGenderMobile) allGenderMobile.checked = true;
            
            activeFilters = {
                gender: [],
                brand: []
            };
            
            displayProducts();
        });
    }
    
    setTimeout(initializePage, 50);
}

window.addEventListener('load', function() {
    resetPageState();
});

window.addEventListener('beforeunload', function() {
    resetPageState();
});
