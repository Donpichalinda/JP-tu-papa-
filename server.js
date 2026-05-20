const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// PRODUCTOS
const PRODUCTS = {
    'prod_laptop_hp': { id: 'prod_laptop_hp', nombre: 'Laptop HP', precio: 1500000, stock: 10 },
    'prod_audifonos_sony': { id: 'prod_audifonos_sony', nombre: 'Audifonos Sony', precio: 350000, stock: 25 },
    'prod_teclado_mecanico': { id: 'prod_teclado_mecanico', nombre: 'Teclado Mecanico', precio: 250000, stock: 50 },
    'prod_monitor_lg': { id: 'prod_monitor_lg', nombre: 'Monitor LG 24"', precio: 800000, stock: 15 },
    'prod_mouse_inalambrico': { id: 'prod_mouse_inalambrico', nombre: 'Mouse Inalambrico', precio: 80000, stock: 100 }
};

// CODIGOS PROMOCIONALES
const PROMOCODES = {
    'DESCUENTO10': { codigo: 'DESCUENTO10', valor: 10, descripcion: '10% descuento', usos_actuales: 0 },
    'BIENVENIDO': { codigo: 'BIENVENIDO', valor: 15, descripcion: '15% descuento nuevos', usos_maximos: 100, usos_actuales: 0 }
};

// ZONAS
const ZONES = {
    'CENTRO': { x: 3, y: 2 }, 'NORTE': { x: 6, y: 4 }, 'SUR': { x: 10, y: 8 },
    'OCCIDENTE': { x: 2, y: 0 }, 'ORIENTE': { x: 7, y: 4 }
};

// CONFIGURACION
const DISCOUNT_THRESHOLD = 200000;
const DISCOUNT_PERCENTAGE = 10;
const SHIPPING_SHORT = { maxDist: 5, price: 5000, name: 'Envio Express' };
const SHIPPING_MEDIUM = { minDist: 5, maxDist: 10, price: 10000, name: 'Envio Estandar' };
const MAX_DISTANCE = 10;

// HEALTH CHECK
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// GET /store/products
app.get('/store/products', (req, res) => {
    res.json({ total: Object.keys(PRODUCTS).length, productos: Object.values(PRODUCTS) });
});

// GET /store/products/:id
app.get('/store/products/:id', (req, res) => {
    const p = PRODUCTS[req.params.id];
    if (!p) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(p);
});

// POST /store/inventory/validate
app.post('/store/inventory/validate', (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ valid: false, error: 'INVALID_REQUEST' });
    
    const errors = [], validated = [];
    for (const item of items) {
        const p = PRODUCTS[item.product_id];
        if (!p) { errors.push({ product_id: item.product_id, error: 'NOT_FOUND' }); continue; }
        if (item.quantity <= 0) { errors.push({ product_id: item.product_id, error: 'INVALID_QTY' }); continue; }
        if (item.quantity > p.stock) {
            errors.push({ product_id: item.product_id, error: 'INSUFFICIENT_STOCK', requested: item.quantity, available: p.stock });
        } else {
            validated.push({ product_id: item.product_id, quantity: item.quantity, unit_price: p.precio });
        }
    }
    res.status(errors.length ? 400 : 200).json({ valid: !errors.length, validated, errors });
});

// GET /store/inventory/:id
app.get('/store/inventory/:id', (req, res) => {
    const p = PRODUCTS[req.params.id];
    if (!p) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ product_id: p.id, stock: p.stock, status: p.stock > 5 ? 'in_stock' : p.stock > 0 ? 'low_stock' : 'out_of_stock' });
});

// POST /store/discounts/calculate
app.post('/store/discounts/calculate', (req, res) => {
    const { subtotal, promo_code } = req.body;
    if (subtotal === undefined) return res.status(400).json({ error: 'INVALID_REQUEST' });
    
    const result = { applies: false, discount_amount: 0, original_subtotal: subtotal, final_subtotal: subtotal };
    const autoApplies = subtotal >= DISCOUNT_THRESHOLD;
    const autoAmount = autoApplies ? Math.floor(subtotal * DISCOUNT_PERCENTAGE / 100) : 0;
    result.auto_threshold_applies = autoApplies;
    
    let promoAmount = 0;
    if (promo_code) {
        const promo = PROMOCODES[promo_code.toUpperCase()];
        if (promo && (!promo.usos_maximos || promo.usos_actuales < promo.usos_maximos)) {
            promoAmount = Math.floor(subtotal * promo.valor / 100);
            result.applies = true; result.type = 'promo_code'; result.code = promo.codigo;
            result.discount_amount = promoAmount; result.promo_valid = true;
        } else {
            result.promo_error = 'INVALID_CODE';
        }
    } else if (autoApplies) {
        result.applies = true; result.type = 'auto_threshold'; result.discount_amount = autoAmount;
    }
    result.final_subtotal = subtotal - result.discount_amount;
    res.json(result);
});

// POST /store/discounts/validate
app.post('/store/discounts/validate', (req, res) => {
    const { code } = req.body;
    const promo = PROMOCODES[code?.toUpperCase()];
    if (!promo) return res.status(404).json({ valid: false, error: 'INVALID_CODE' });
    res.json({ valid: true, code: promo.codigo, value: promo.valor });
});

// GET /store/discounts/codes
app.get('/store/discounts/codes', (req, res) => {
    res.json({ codes: Object.values(PROMOCODES).map(p => ({ code: p.codigo, value: p.valor, description: p.descripcion })) });
});

// Calcula distancia
const calcDist = (x, y) => Math.sqrt(x*x + y*y);

// POST /store/shipping/calculate
app.post('/store/shipping/calculate', (req, res) => {
    const { x, y, zone } = req.body;
    let tx = x, ty = y;
    if (zone) { const z = ZONES[zone.toUpperCase()]; if (!z) return res.status(400).json({ available: false, error: 'ZONE_NOT_FOUND' }); tx = z.x; ty = z.y; }
    if (tx === undefined) return res.status(400).json({ available: false, error: 'MISSING_LOCATION' });
    
    const dist = Math.round(calcDist(tx, ty) * 100) / 100;
    let result = { available: false, distance: dist, price: 0, status: 'rejected' };
    
    if (dist < SHIPPING_SHORT.maxDist) {
        result = { available: true, distance: dist, price: SHIPPING_SHORT.price, tariff: SHIPPING_SHORT.name, message: 'Envio Express' };
    } else if (dist <= SHIPPING_MEDIUM.maxDist) {
        result = { available: true, distance: dist, price: SHIPPING_MEDIUM.price, tariff: SHIPPING_MEDIUM.name, message: 'Envio Estandar' };
    }
    res.json(result);
});

// GET /store/shipping/zones
app.get('/store/shipping/zones', (req, res) => {
    const zones = Object.entries(ZONES).map(([n, d]) => ({ zone: n, distance: Math.round(calcDist(d.x, d.y) * 100) / 100, available: calcDist(d.x, d.y) <= MAX_DISTANCE }));
    res.json({ zones });
});

// GET /store/shipping/tariffs
app.get('/store/shipping/tariffs', (req, res) => {
    res.json({ SHORT: SHIPPING_SHORT, MEDIUM: SHIPPING_MEDIUM, MAX_DISTANCE });
});

// POST /store/orders - Crea orden con todas las validaciones
app.post('/store/orders', (req, res) => {
    const { items, zone, promo_code } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'INVALID_REQUEST' });
    
    // Validar inventario
    const validated = [], invErrors = [];
    for (const item of items) {
        const p = PRODUCTS[item.product_id];
        if (!p) { invErrors.push({ product_id: item.product_id, error: 'NOT_FOUND' }); continue; }
        if (item.quantity > p.stock) { invErrors.push({ product_id: item.product_id, error: 'INSUFFICIENT_STOCK' }); }
        else validated.push({ ...p, quantity: item.quantity, line_total: p.precio * item.quantity });
    }
    if (invErrors.length) return res.status(400).json({ success: false, error: 'INVENTORY_ERROR', errors: invErrors });
    
    const subtotal = validated.reduce((s, i) => s + i.line_total, 0);
    
    // Calcular descuento
    let discount = { applies: false, amount: 0 };
    const autoApplies = subtotal >= DISCOUNT_THRESHOLD;
    let promoAmount = 0;
    if (promo_code) {
        const promo = PROMOCODES[promo_code.toUpperCase()];
        if (promo && (!promo.usos_maximos || promo.usos_actuales < promo.usos_maximos)) {
            promo.usos_actuales++;
            promoAmount = Math.floor(subtotal * promo.valor / 100);
            discount = { applies: true, type: 'promo_code', code: promo.codigo, amount: promoAmount };
        }
    } else if (autoApplies) {
        discount = { applies: true, type: 'auto_threshold', amount: Math.floor(subtotal * DISCOUNT_PERCENTAGE / 100) };
    }
    
    const subtotalAfterDiscount = subtotal - discount.amount;
    
    // Calcular envio
    let shipping = { available: false };
    if (zone) {
        const z = ZONES[zone.toUpperCase()];
        if (z) {
            const dist = Math.round(calcDist(z.x, z.y) * 100) / 100;
            if (dist < SHIPPING_SHORT.maxDist) shipping = { available: true, distance: dist, price: SHIPPING_SHORT.price };
            else if (dist <= SHIPPING_MEDIUM.maxDist) shipping = { available: true, distance: dist, price: SHIPPING_MEDIUM.price };
            else return res.status(400).json({ success: false, error: 'SHIPPING_EXCEEDED', distance: dist });
        }
    }
    
    // Crear orden
    const order = { id: 'ORD-' + Date.now(), created_at: new Date().toISOString(), items: validated,
        summary: { subtotal, discount, subtotal_after_discount: subtotalAfterDiscount, shipping, total: subtotalAfterDiscount + (shipping.price || 0) } };
    
    // Descontar stock
    for (const i of validated) PRODUCTS[i.id].stock -= i.quantity;
    
    res.status(201).json({ success: true, order });
});

// START SERVER
app.listen(PORT, () => {
    console.log('===========================================');
    console.log('  TIENDA DEMO - Servidor de Pruebas');
    console.log('===========================================');
    console.log('  Puerto:', 'http://localhost:' + PORT);
    console.log('  Health:', 'http://localhost:' + PORT + '/health');
    console.log('');
    console.log('  ENDPOINTS:');
    console.log('  GET  /store/products');
    console.log('  GET  /store/products/:id');
    console.log('  POST /store/inventory/validate');
    console.log('  POST /store/discounts/calculate');
    console.log('  POST /store/shipping/calculate');
    console.log('  POST /store/orders');
    console.log('===========================================');
});
