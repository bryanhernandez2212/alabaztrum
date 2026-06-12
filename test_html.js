function escapeHTML(str) {
    return (str || '').toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const p = {
    id: "1",
    name: "9PM",
    price: 100,
    images: ["http://example.com/img'quote.jpg"]
};

const img = p.images[0];
const safeName = encodeURIComponent(p.name).replace(/'/g, "%27");
const safeImg = escapeHTML(img);
const inStock = true;
const price = 100;

const onclickAttr = inStock ? `addToCart('${p.id}', decodeURIComponent('${safeName}'), ${price}, '${safeImg}')` : '';

console.log("ONCLICK ATTRIBUTE:");
console.log(onclickAttr);
