const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><div id="productsGrid"></div><div id="productsCountLabel"></div>`);
const document = dom.window.document;

const PLACEHOLDER_IMG = "PLACEHOLDER";
const allProducts = [
    { id: "1", name: "9PM Rebel", brand: "Afnan", price: 1200, category: "fragancia" },
    { id: "2", name: "9PM", brand: "Afnan", price: 1000, category: "fragancia" }
];

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

try {
    renderProducts(allProducts);
    console.log("SUCCESS");
    console.log(document.getElementById('productsGrid').innerHTML.substring(0, 200));
} catch (e) {
    console.log("ERROR:", e);
}
