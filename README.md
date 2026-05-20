# Tienda Demo - Proyecto de Pruebas de Software

Aplicación web sencilla para simular una tienda e-commerce con lógica de negocio implementada.

## Funcionalidades Implementadas

### 1. Validación de Inventario
**Regla:** El sistema impide realizar compras si no hay stock suficiente.

- Si la cantidad solicitada > stock disponible → ORDEN RECHAZADA
- Endpoint: `POST /store/inventory/validate`

### 2. Lógica de Descuentos
**Regla:** 10% de descuento cuando:
- Valor total > $200.000 (descuento automático)
- Se usa código promocional válido: `DESCUENTO10` o `BIENVENIDO`

**Nota:** Los descuentos NO son acumulables. Código promocional tiene prioridad.

### 3. Cálculo de Envío
**Regla:** Costo basado en distancia euclidiana desde la tienda:

| Distancia | Costo |
|-----------|-------|
| < 5 km | $5.000 |
| 5-10 km | $10.000 |
| > 10 km | RECHAZADO |

## Guía de Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor
```bash
npm start
```

El servidor estará disponible en: **http://localhost:3000**

## Endpoints para Probar (Postman/cURL)

### Listar Productos
```bash
curl http://localhost:3000/store/products
```

### Validar Inventario
```bash
# Stock suficiente
curl -X POST http://localhost:3000/store/inventory/validate \
  -H "Content-Type: application/json" \
  -d '{"items": [{"product_id": "prod_laptop_hp", "quantity": 2}]}'

# Stock insuficiente
curl -X POST http://localhost:3000/store/inventory/validate \
  -H "Content-Type: application/json" \
  -d '{"items": [{"product_id": "prod_laptop_hp", "quantity": 100}]}'
```

### Calcular Descuento
```bash
# Compra > $200.000 (aplica automático 10%)
curl -X POST http://localhost:3000/store/discounts/calculate \
  -H "Content-Type: application/json" \
  -d '{"subtotal": 500000}'

# Con código promocional
curl -X POST http://localhost:3000/store/discounts/calculate \
  -H "Content-Type: application/json" \
  -d '{"subtotal": 100000, "promo_code": "DESCUENTO10"}'

# Validar código
curl -X POST http://localhost:3000/store/discounts/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "DESCUENTO10"}'
```

### Calcular Envío
```bash
# Por coordenadas
curl -X POST http://localhost:3000/store/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{"x": 3, "y": 4}'

# Por zona
curl -X POST http://localhost:3000/store/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{"zone": "NORTE"}'

# Zonas disponibles
curl http://localhost:3000/store/shipping/zones
```

### Crear Orden Completa
```bash
curl -X POST http://localhost:3000/store/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "prod_laptop_hp", "quantity": 1}],
    "zone": "CENTRO",
    "promo_code": "DESCUENTO10"
  }'
```

## Casos de Prueba Sugeridos

### Inventario
1. Compra normal → Exitosa
2. Compra con stock insuficiente → Rechazada
3. Producto inexistente → Error
4. Cantidad = 0 → Rechazada

### Descuentos
1. Compra < $200.000 sin código → Sin descuento
2. Compra > $200.000 sin código → 10% descuento automático
3. Compra < $200.000 con DESCUENTO10 → 10% descuento
4. Compra > $200.000 con código → Código tiene prioridad

### Envío
1. Zona OCCIDENTE (2km) → $5.000
2. Zona NORTE (7km) → $10.000
3. Zona SUR (12km) → RECHAZADA
4. Coordenadas (3,4) = 5km → $10.000

## Productos Disponibles

| ID | Nombre | Precio | Stock |
|----|--------|--------|-------|
| prod_laptop_hp | Laptop HP | $1.500.000 | 10 |
| prod_audifonos_sony | Audifonos Sony | $350.000 | 25 |
| prod_teclado_mecanico | Teclado Mecanico | $250.000 | 50 |
| prod_monitor_lg | Monitor LG 24" | $800.000 | 15 |
| prod_mouse_inalambrico | Mouse Inalambrico | $80.000 | 100 |
