let allProducts = [
    { id: "1", name: "9PM Rebel", brand: "Afnan", price: 1200, category: "fragancia" },
    { id: "2", name: "9PM", brand: "Afnan", price: 1000, category: "fragancia" },
    { id: "3", name: "Eros", brand: "Versace", price: 1500, category: "decant" }
];

function normalizeText(text) {
    return String(text || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function filterProducts(query, catValue) {
    const cat = catValue.toLowerCase();
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
    console.log(filtered.map(p => p.name));
}

filterProducts("9", "");
filterProducts("Afnan", "");
filterProducts("Eros", "");
