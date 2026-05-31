# Documentación Técnica - Tienda Demo

## 1. Descripción del Sistema

Tienda Demo es una aplicación web e-commerce basada en MedusaJS v2 que simula una tienda en línea para realizar pruebas de software. El sistema implementa tres módulos de negocio personalizados que gestionan la validación de inventario, lógica de descuentos y cálculo de costos de envío.

### 1.1 Propósito
Simular una tienda e-commerce con reglas de negocio específicas para facilitar:
- Pruebas unitarias de caja blanca
- Pruebas de integración
- Pruebas de caja negra
- Pruebas de rendimiento

### 1.2 Tecnologías Utilizadas
- **Backend:** Node.js + MedusaJS Framework v2.13.6
- **Base de datos:** SQLite (configuración predeterminada de MedusaJS)
- **API:** REST API expuesta por MedusaJS
- **Frontend:** React + Vite (tienda de demostración básica)
- **Testing:** Jest con MedusaJS Test Utilities

## 2. Arquitectura del Sistema

### 2.1 Arquitectura General
El sistema sigue una arquitectura modular típica de MedusaJS:
- **Capa de Presentación:** REST API y panel de administración
- **Capa de Lógica de Negocio:** Módulos personalizados (tienda-inventory, tienda-discount, tienda-shipping)
- **Capa de Persistencia:** SQLite mediante ORM de MedusaJS
- **Capa de Integración:** Workflows, suscriptores y jobs para procesos asíncronos

### 2.2 Componentes Principales
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API REST      │    │   Panel Admin    │    │   Tienda Web    │
│ (MedusaJS)      │    │ (MedusaJS Admin) │    │ (React/Vite)    │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                         │
          ▼                      ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Capa de Aplicación                          │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐  │
│  │ tienda-inventory│ │ tienda-discount  │ │ tienda-shipping │  │
│  │   (Módulo)      │ │   (Módulo)       │ │   (Módulo)      │  │
│  └─────────────────┘ └──────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Base de Datos   │
                    │    (SQLite)      │
                    └──────────────────┘
```

## 3. Módulos Principales y Roles/Actores

### 3.1 Módulos de Negocio Personalizados

#### 3.1.1 Módulo de Inventario (tienda-inventory)
- **Responsabilidad:** Gestionar el stock de productos y validar disponibilidad antes de las compras
- **Archivos clave:**
  - `src/modules/tienda-inventory/service.ts` - Lógica de negocio
  - `src/modules/tienda-inventory/models/product-inventory.ts` - Modelo de datos
  - `src/modules/tienda-inventory/__tests__/inventory.unit.spec.ts` - Pruebas unitarias
- **Relaciones:** Se integra con el flujo de creación de órdenes mediante validación previa

#### 3.1.2 Módulo de Descuentos (tienda-discount)
- **Responsabilidad:** Aplicar descuentos según reglas de negocio (automático por monto y códigos promocionales)
- **Archivos clave:**
  - `src/modules/tienda-discount/service.ts` - Lógica de negocio
  - `src/modules/tienda-discount/models/promo-code.ts` - Modelo de datos
  - `src/modules/tienda-discount/__tests__/discount.unit.spec.ts` - Pruebas unitarias
- **Relaciones:** Se integra en el cálculo de totales de órdenes

#### 3.1.3 Módulo de Envío (tienda-shipping)
- **Responsabilidad:** Calcular costos de envío basado en distancia euclidiana desde la tienda
- **Archivos clave:**
  - `src/modules/tienda-shipping/service.ts` - Lógica de negocio
  - `src/modules/tienda-shipping/models/shipping-zone.ts` - Modelo de datos
  - `src/modules/tienda-shipping/__tests__/shipping.unit.spec.ts` - Pruebas unitarias
- **Relaciones:** Se integra en el proceso de checkout para determinar costos de entrega

### 3.2 Roles y Actores del Sistema

| Actor/Rol | Descripción | Responsabilidades |
|-----------|-------------|-------------------|
| **Cliente Final** | Usuario que navega y compra en la tienda | - Navegar productos<br>- Agregar al carrito<br>- Aplicar códigos promocionales<br>- Seleccionar zona de envío<br>- Completar compra |
| **Administrador** | Usuario que gestiona la tienda mediante el panel admin | - Gestionar productos<br>- Crear/gestionar códigos promocionales<br>- Configurar zonas de envío<br>- Ver órdenes y reportes |
| **Sistema** | El backend de MedusaJS que procesa las solicitudes | - Validar inventario<br>- Aplicar descuentos<br>- Calcular envíos<br>- Procesar órdenes<br>- Mantener integridad de datos |
| **Desarrollador/QA** | Equipo que desarrolla y prueba el sistema | - Escribir y mantener código<br>- Ejecutar pruebas unitarias/integración<br>- Reportar y corregir defects |

## 4. Funcionalidades Clave

### 4.1 Validación de Inventario

**Actor:** Sistema (activado durante el proceso de creación de orden)
**Flujo:**
1. Cliente intenta crear una orden con productos y cantidades
2. Sistema llama al módulo de inventario para validar disponibilidad
3. Módulo verifica stock disponible vs cantidad solicitada para cada producto
4. Si todos los productos tienen suficiente stock:
   - Orden continúa al siguiente paso (descuentos/envío)
   - Stock se reserva (opcional, depende de implementación)
5. Si algún producto tiene stock insuficiente:
   - Orden es rechazada inmediatamente
   - Se devuelve mensaje detallando qué productos fallaron y por qué

**Reglas de Negocio Detalladas:**
- **RN-01.1:** El sistema debe verificar la existencia del producto antes de validar stock
  - Si producto no existe → Error "NOT_FOUND"
- **RN-01.2:** La cantidad solicitada debe ser mayor a cero
  - Si cantidad ≤ 0 → Error "INVALID_QTY"
- **RN-01.3:** Si cantidad solicitada > stock disponible → Orden rechazada
  - Error "INSUFFICIENT_STOCK" con detalle de shortfall
- **RN-01.4:** Si cantidad solicitada ≤ stock disponible → Validación exitosa
- **RN-01.5:** En órdenes múltiples, si ANY producto falla, TODA la orden se rechaza
  - Pero los productos válidos aún se registran en el campo "validated" para información

### 4.2 Lógica de Descuentos

**Actor:** Sistema (activado durante cálculo de totales de orden)
**Flujo:**
1. Sistema recibe solicitud de cálculo de descuento con subtotal y opcional código promocional
2. Módulo verifica si aplica descuento automático (subtotal ≥ $200.000)
3. Módulo verifica si se proporcionó código promocional válido
4. Aplica reglas de prioridad:
   - Si se proporciona código válido → Usa SOLO ese descuento (no acumulable)
   - Si no hay código pero aplica automático → Usa descuento del 10%
   - Si no aplica ninguno → Sin descuento
5. Calcula total final = subtotal - descuento aplicado

**Reglas de Negocio Detalladas:**
- **RN-02.1:** Descuento automático del 10% cuando subtotal ≥ $200.000
  - Aplica exactamente cuando: subtotal >= 200000
  - Cálculo: floor(subtotal * 10 / 100)
- **RN-02.2:** Códigos promocionales válidos aplican su porcentaje de descuento
  - Códigos configurados: DESCUENTO10 (10%), BIENVENIDO (15%)
  - Verificación case-insensitive (convertir a mayúsculas)
- **RN-02.3:** Los descuentos NO son acumulables
  - Prioridad: Código promocional > Descuento automático > Ninguno
  - Si ambos aplican, solo se usa el código promocional
- **RN-02.4:** Códigos promocionales tienen límite de usos configurável
  - Si usos_actuales >= usos_maximos → Código inválido
  - Si usos_maximos es null → Ilimitado
- **RN-02.5:** Validación de códigos promocionales
  - Debe existir en base de datos
  - Debe no haber alcanzado límite de usos
  - Debe estar activo (implícito por existencia en tabla)

### 4.3 Cálculo de Costos de Envío

**Actor:** Sistema (activado cuando cliente consulta costo de envío o durante checkout)
**Flujo:**
1. Sistema recibe coordenadas (x, y) o nombre de zona
2. Si se proporciona zona, busca sus coordenadas en base de datos
3. Calcula distancia euclidiana desde origen (0,0): distancia = √(x² + y²)
4. Aplica tarifas según rango de distancia:
   - < 5 km: $5.000 (Envío Express)
   - 5-10 km: $10.000 (Envío Estándar)
   - > 10 km: Compra rechazada
5. Retorna disponibilidad, costo, distancia calculada y tipo de tarifa

**Reglas de Negocio Detalladas:**
- **RN-03.1:** Distancia < 5 km → Envío Express ($5.000)
  - Fórmula: distancia = √(x² + y²)
  - Condición: distancia < 5
- **RN-03.2:** 5 km ≤ distancia ≤ 10 km → Envío Estándar ($10.000)
  - Fórmula: distancia = √(x² + y²)
  - Condición: 5 ≤ distancia ≤ 10
- **RN-03.3:** Distancia > 10 km → Compra rechazada
  - Fórmula: distancia = √(x² + y²)
  - Condición: distancia > 10
  - Mensaje indica distancia máxima permitida (10 km)
- **RN-03.4:** Distancia se calcula desde punto fijo de tienda (0,0)
  - Origen coordenadas: (0, 0) representa ubicación de la tienda
- **RN-03.5:** Se pueden usar coordenadas directas o nombres de zona predefinidos
  - Zonas configuradas en base de datos con coordenadas x, y
- **RN-03.6:** Validación de entrada requerida
  - Debe proporcionar coordenadas (x, y) O nombre de zona válido
  - Faltante de ambos → Error "MISSING_LOCATION"
  - Zona inexistente → Error "ZONE_NOT_FOUND"

## 5. Casos de Prueba

**Nota importante sobre el conteo de casos de prueba:**
Tras un análisis exhaustivo de todos los archivos de prueba del proyecto (excluyendo dependencias de `node_modules`), se confirma que existen exactamente **29 casos de prueba** distribuidos de la siguiente manera:
- **18 pruebas unitarias** (7 en inventario, 7 en descuentos, 4 en envío)
- **11 pruebas de integración** (10 en flujo de órdenes completas, 1 en health check)

Este conteo resuelve las discrepancias observadas en otras fuentes, donde se reportaban números como:
- 18 (solo pruebas unitarias)
- 28 (unitarias + pruebas de órdenes pero omitiendo el health check)
- Conteos inflados (47-49) que incluían erróneamente tests de dependencias externas o realizaron errores en el conteo

A continuación se detallan todos los casos de prueba identificados en el código fuente, organizados por módulo.

### 5.1 Casos de Prueba - Módulo de Inventario (CP-01 a CP-07)

| ID | Descripción | Precondición | Entrada | Resultado Esperado | Técnica | Regla |
|----|-------------|--------------|---------|-------------------|---------|-------|
| CP-01 | Compra con stock suficiente | Producto "laptop_hp" tiene stock = 10 | quantity = 5 | valid = true | Partición de equivalencia (clase válida) | RN-01.4 |
| CP-02 | Compra con stock insuficiente | Producto "laptop_hp" tiene stock = 10 | quantity = 15 | valid = false, error INSUFFICIENT_STOCK | Partición de equivalencia (clase inválida) | RN-01.3 |
| CP-03 | Compra con stock exacto (valor límite) | Producto "laptop_hp" tiene stock = 10 | quantity = 10 | valid = true | Valor límite (frontera exacta) | RN-01.4 |
| CP-04 | Compra con cantidad cero (valor límite inferior) | Producto existe | quantity = 0 | valid = false, error INVALID_QTY | Valor límite (frontera inferior) | RN-01.2 |
| CP-05 | Compra con cantidad negativa | Producto existe | quantity = -3 | valid = false, error INVALID_QTY | Valor límite (fuera de frontera) | RN-01.2 |
| CP-06 | Compra con producto inexistente | Producto NO existe | product_id = "producto_fantasma", quantity = 1 | valid = false, error NOT_FOUND | Partición de equivalencia (clase inválida) | RN-01.1 |
| CP-07 | Compra múltiple donde un producto falla | "laptop_hp" stock=10, "mouse_inalambrico" stock=100 | laptop qty=11 (excede), mouse qty=2 (OK) | valid = false (orden rechazada), mouse validado correctamente | Condición múltiple / Combinatorio | RN-01.5 |

### 5.2 Casos de Prueba - Módulo de Descuentos (CP-08 a CP-14)

| ID | Descripción | Precondición | Entrada | Resultado Esperado | Técnica | Regla |
|----|-------------|--------------|---------|-------------------|---------|-------|
| CP-08 | Compra < $200.000 sin código promo | No se proporciona código promo | subtotal = 150000 | Sin descuento (applies = false) | Partición de equivalencia (subtotal bajo umbral, sin código) | RN-02.1 |
| CP-09 | Compra >= $200.000 sin código (descuento automático) | No se proporciona código promo | subtotal = 250000 | 10% automático = $25.000 de descuento | Partición de equivalencia (subtotal sobre umbral) | RN-02.1 |
| CP-10 | Compra exactamente $200.000 (valor frontera) | No se proporciona código promo | subtotal = 200000 | Aplica descuento automático (>=) | Valor límite (frontera exacta del umbral) | RN-02.1 |
| CP-11 | Compra con código "DESCUENTO10" válido (subtotal < $200.000) | Código DESCUENTO10 existe con valor=10 | subtotal = 100000, promo_code = "DESCUENTO10" | type = "promo_code", descuento = $10.000 | Partición de equivalencia (código válido + subtotal bajo) | RN-02.2 |
| CP-12 | No acumulabilidad - código promo + umbral automático | Código DESCUENTO10 existe. Subtotal supera umbral. | subtotal = 300000, promo_code = "DESCUENTO10" | Se aplica SOLO el código promo (tiene prioridad). Descuento = 30.000 (10% de 300.000 por código) | Condición múltiple (ambas condiciones true) | RN-02.3 |
| CP-13 | Código promocional inválido | El código NO existe en la base de datos | code = "CODIGOINEXISTENTE" | valid = false, error = "INVALID_CODE" | Partición de equivalencia (clase inválida) | RN-02.4 |
| CP-14 | Código promocional case-insensitive | Código "DESCUENTO10" existe en la base de datos | code = "descuento10" (minúsculas) | valid = true, code = "DESCUENTO10" | Cobertura de sentencia (verifica .toUpperCase()) | RN-02.6 |

### 5.3 Casos de Prueba - Módulo de Envío (CP-15 a CP-18)

| ID | Descripción | Precondición | Entrada | Resultado Esperado | Técnica | Regla |
|----|-------------|--------------|---------|-------------------|---------|-------|
| CP-15 | Envío zona CENTRO (distancia < 5 km → Envío Express) | Zona CENTRO existe con coordenadas (3, 2) | zone = "CENTRO" | available = true, price = 5000, tariff = "Envio Express" | Partición de equivalencia (distancia corta < 5 km) | RN-03.1 |
| CP-16 | Envío zona NORTE (distancia entre 5 y 10 km → Envío Estándar) | Zona NORTE existe con coordenadas (6, 4) | zone = "NORTE" | available = true, price = 10000, tariff = "Envio Estandar" | Partición de equivalencia (distancia media 5-10 km) | RN-03.2 |
| CP-17 | Envío zona SUR (distancia > 10 km → RECHAZADA) | Zona SUR existe con coordenadas (10, 8) | zone = "SUR" | available = false, envío rechazado | Partición de equivalencia (distancia excesiva > 10 km) | RN-03.3 |
| CP-18 | Envío con zona inexistente | La zona "NOEXISTE" no está registrada | zone = "NOEXISTE" | available = false, error = "ZONE_NOT_FOUND" | Partición de equivalencia (clase inválida - zona no registrada) | RN-03.6 |

**Nota:** Los casos de prueba CP-19 en adelante no están implementados en el código actual pero podrían incluir pruebas con coordenadas directas, valores límite de distancia (exactamente 5km y 10km), y coordenadas negativas.

## 6. Diseño del Proceso de Pruebas

### 6.1 Alcance (Scope)

**¿Qué se prueba?**
- **Pruebas Unitarias:** Todos los métodos públicos de los tres módulos personalizados (tienda-inventory, tienda-discount, tienda-shipping)
- **Pruebas de Integración:** Flujo completo de creación de orden que involucra validación de inventario, cálculo de descuentos y cálculo de envío
- **Pruebas de API REST:** Endpoints expuestos por los módulos personalizados
- **Pruebas de Caja Negra:** Validación de entradas y salidas según especificaciones de negocio
- **Pruebas de Caja Blanca:** Cobertura de código, ramas, condiciones y valores límite

**¿Qué NO se prueba?**
- **Interfaz de Usuario (Frontend):** La tienda web básica en React/Vite no es parte del alcance de pruebas en este documento
- **Panel de Administración:** Funcionalidades del admin de MedusaJS (se asume que están probadas por el framework)
- **Infraestructura de Base de Datos:** Operaciones básicas de SQLite (se asume que MedusaJS las maneja correctamente)
- **Rendimiento y Carga:** Pruebas de estrés, carga concurrente y escalabilidad (podrían ser objeto de un plan de pruebas separado)
- **Seguridad:** Pruebas de penetración, validación de autenticación/autorización (fuera del alcance de las reglas de negocio implementadas)
- **Integraciones Externas:** Pasarelas de pago, servicios de email, etc. (no implementadas en esta versión demo)

### 6.2 Criterios de Entrada

El proceso de pruebas puede iniciar cuando se cumplan TODAS las siguientes condiciones:

1. **Código Estable:** 
   - Código fuente compilado exitosamente (sin errores de TypeScript)
   - Último commit en rama principal (main) o rama de desarrollo estable
   - No hay cambios pendientes de revisión en pull requests activos

2. **Entorno Configurado:**
   - Node.js >= 20 instalado y configurado
   - Dependencias instaladas (`npm install` ejecutado exitosamente)
   - Base de datos SQLite accesible (se crea automáticamente al iniciar MedusaJS)
   - Puertos requeridos disponibles (3000 para API, 8000 para admin por defecto)

3. **Datos de Prueba Disponibles:**
   - Scripts de semillado ejecutados (`npm run seed:tienda` o `npm run seed`)
   - Datos de productos, códigos promocionales y zonas de envío poblados en base de datos
   - Mocks de prueba configurados correctamente en los archivos de especificación

4. **Herramientas de Testing:**
   - Jest configurado y funcional
   - MedusaJS Test Utilities accesible
   - Capacidad para ejecutar `npm test` o scripts de prueba específicos

5. **Documentación Disponible:**
   - Este documento de especificaciones y casos de prueba accesible al equipo de QA
   - Comentarios en código explicando reglas de negocio
   - README con instrucciones de ejecución

### 6.3 Criterios de Salida

El proceso de pruebas se considera completado cuando se cumplan TODAS las siguientes condiciones:

1. **Ejecución de Pruebas:**
   - **Mínimo 90% de casos de prueba unitarios exitosos** (requisito explícito del usuario)
   - **Mínimo 80% de pruebas de integración exitosas** (estándar industry para sistemas complejos)
   - **0 pruebas críticas fallando** (aquellas marcadas como prioritarias en especificaciones)

2. **Cobertura de Código:**
   - Cobertura de sentencias mínima del 85%
   - Cobertura de ramas mínima del 75%
   - Cobertura de funciones mínima del 90%

3. **Informes y Documentación:**
   - Reporte de pruebas ejecutado y archivado
   - Todos los defects críticos y altos documentados y asignados
   - Evidencia de ejecución de pruebas disponible (logs, capturas, reportes)

4. **Aprobación de Stakeholders:**
   - Líder de testing aprueba el reporte final
   - Product Owner confirma que funcionalidades críticas cumplen requisitos
   - Arquitecto técnico verifica que no se introdujeron regresiones críticas

5. **Condiciones de Salida Adicionales:**
   - No hay bloqueadores (defects de severidad "Bloqueador") pendientes de resolución
   - El porcentaje de defects resueltos vs. encontrados es >= 85% para defects de mediana y alta severidad
   - El build del proceso pasa en el entorno de integración continua (si está configurado)

### 6.4 Métricas de Éxito

Para medir el éxito del proceso de pruebas, se seguirán las siguientes métricas:

| Métrica | Objetivo | Herramienta de Medición |
|---------|----------|-------------------------|
| % Casos de Prueba Exitosos | ≥ 90% (unitarios) | Jest Test Results |
| % Cobertura de Código | ≥ 85% sentencias, ≥ 75% ramas | Jest + Istanbul/nyc |
| Defects Críticos | 0 | Sistema de Gestión de Defects (ej. Jira, GitHub Issues) |
| Tiempo Medio de Resolución (MTTR) | < 24 horas para defects altos | Sistema de Gestión de Defects |
| Estabilidad de Build | ≥ 95% de builds exitosos en CI | Sistema de CI/CD (GitHub Actions, etc.) |
| Satisfacción del Equipo | ≥ 4/5 en encuesta post-sprint | Encuesta de equipo |

### 6.5 Entrada/Salida Específica por Tipo de Prueba

#### Pruebas Unitarias
- **Entrada:** Código compilado, mocks de dependencias configurados, datos de prueba en memoria
- **Salida:** Reporte de cobertura, porcentaje de tests passed/failed, lista de defects por módulo

#### Pruebas de Integración  
- **Entrada:** Base de datos poblada con datos de semillado, API funcionando
- **Salida:** Reporte de flujo end-to-end, verificación de transacciones completas, validación de cambios en base de datos

#### Pruebas de API REST
- **Entrada:** Servidor corriendo, colección de requests (Postman/cURL) o tests automatizados
- **Salida:** Validación de códigos de estado, esquemas de respuesta, tiempos de respuesta

## 7. Conclusiones y Recomendaciones

Este documento proporciona una base sólida para el proceso de pruebas de la aplicación Tienda Demo. Al seguir los criterios de entrada y salida establecidos, el equipo puede asegurar que:

1. Las reglas de negocio críticas están adecuadamente validadas
2. El software cumple con los requisitos funcionales especificados
3. Se mantiene un nivel de calidad adecuado para un sistema de demostración
4. Las pruebas son reproducibles y medibles
5. Existe trazabilidad clara entre requisitos, casos de prueba y código implementado

**Recomendaciones para futuras iteraciones:**
- Automatizar la ejecución de pruebas en pipeline de CI/CD
- Implementar pruebas de rendimiento con herramientas como k6 o Artillery
- Ampliar cobertura con pruebas de contrato (pact) para servicios externos
- Añadir pruebas de accesibilidad para el frontend si se desarrolla más
- Implementar testing de mutación para evaluar efectividad de pruebas unitarias