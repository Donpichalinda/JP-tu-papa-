# Tienda Demo - Especificación

## 1. Proyecto

**Nombre:** Tienda Demo - Pruebas de Software
**Tipo:** Aplicación web backend basada en MedusaJS
**Objetivo:** Simular una tienda e-commerce para pruebas de software (caja blanca, caja negra, automatizadas y de desempeño)

## 2. Stack Tecnológico

- **Backend:** Node.js + MedusaJS
- **Base de datos:** SQLite (en memoria/archivo local para simplicidad)
- **API:** REST API de MedusaJS
- **Administración:** Panel admin de MedusaJS

## 3. Funcionalidades de Negocio

### 3.1 Validación de Inventario

**Regla:** El sistema debe impedir realizar una compra si no hay suficiente stock disponible.

**Lógica:**
- Antes de confirmar una orden, verificar que la cantidad solicitada de cada producto no supere el stock disponible
- Si el stock es insuficiente, rechazar la orden con un mensaje de error claro indicando qué productos tienen stock insuficiente

### 3.2 Lógica de Descuentos

**Regla:** Aplicar descuento del 10% bajo ciertas condiciones.

**Condiciones:**
- Si el valor total de la compra supera los $200.000 pesos, aplicar 10% de descuento automáticamente
- Si se utiliza un código promocional válido (ej: "DESCUENTO10"), aplicar 10% de descuento
- Los descuentos no son acumulables

**Códigos promocionales válidos:**
- `DESCUENTO10` - 10% de descuento

### 3.3 Cálculo de Costos de Envío

**Regla:** El costo de envío depende de la distancia al cliente.

**Tarifas:**
- Distancia < 5 km: $5.000 pesos
- Distancia entre 5 y 10 km: $10.000 pesos
- Distancia > 10 km: RECHAZAR la compra (mostrar error)

## 4. Datos de Prueba

### Productos

| ID | Nombre | Precio | Stock |
|----|--------|--------|-------|
| 1 | Laptop HP | $1.500.000 | 10 |
| 2 | Audífonos Sony | $350.000 | 25 |
| 3 | Teclado Mecánico | $250.000 | 50 |
| 4 | Monitor LG 24" | $800.000 | 15 |
| 5 | Mouse Inalámbrico | $80.000 | 100 |

### Regiones/Zonas de Envío (para cálculo de distancia)

| Zona | Distancia |
|------|-----------|
| Centro | 3 km |
| Norte | 7 km |
| Sur | 12 km |
| Occidente | 2 km |
| Oriente | 8 km |

## 5. Endpoints Principales

### Productos
- `GET /store/products` - Listar productos disponibles
- `GET /store/products/:id` - Obtener detalle de un producto

### Órdenes
- `POST /store/orders` - Crear una nueva orden (con validación de inventario)
- `GET /store/orders/:id` - Obtener detalle de una orden
- `GET /store/orders` - Listar órdenes

### Carritos
- `POST /store/carts` - Crear un carrito
- `POST /store/carts/:id/line-items` - Agregar producto al carrito
- `POST /store/carts/:id/complete` - Completar carrito (crear orden)

### Descuentos
- `POST /store/discounts/validate` - Validar código promocional
- `POST /store/discounts` - Crear descuento (admin)

### Envío
- `POST /store/shipping/calculate` - Calcular costo de envío por distancia

## 6. Requisitos de Implementación

- Código fuente bien comentado explicando la lógica de negocio
- Estructura modular de MedusaJS
- Datos de prueba precargados
- Documentación de endpoints
- Guía de ejecución local
