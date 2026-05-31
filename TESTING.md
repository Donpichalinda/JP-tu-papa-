# Pruebas (Unitarias e Integración)

Este repositorio incluye pruebas unitarias (TypeScript + Jest) para los servicios en `src/services` y pruebas de integración ubicadas en `medusa-app/**/integration-tests`.

---

## Pruebas Unitarias (Caja Blanca) ✅ FUNCIONANDO

**Descripción:** Prueban la lógica interna de los servicios sin dependencias externas.

**Ubicación:** `src/services/__tests__/`
- `discount.service.spec.ts` — 4 tests (umbral, códigos promo, validación)
- `inventory.service.spec.ts` — 3 tests (stock, reserva, restauración)
- `shipping.service.spec.ts` — 4 tests (distancia, zonas, cálculo euclidiano)

**Ejecutar:**
```bash
npm run test:unit
```

**Resultado:** ✅ 11 tests unitarios pasando

---

## Pruebas de Integración (Automatización E2E)

**Descripción:** Prueban flujos completos de negocio a través de APIs HTTP.

**Ubicación:** `medusa-app/tiendademo-medusa/integration-tests/http/`
- `tienda-orders.spec.ts` — Orden completa, rechazos por stock/distancia, validaciones
- `health.spec.ts` — Health check del servidor

**Requisitos:**
- Docker y Docker Compose instalados
- PostgreSQL 15 ejecutándose

### Opción 1: Levantar BD con Docker (Recomendado)

```bash
# Levantar PostgreSQL
docker-compose up -d

# Esperar a que esté listo (5-10 segundos)
docker ps  # Verificar que tiendademo-db esté Running

# Ejecutar tests de integración
npm run test:integration

# Detener PostgreSQL
docker-compose down
```

### Opción 2: Usar Script PowerShell (Windows)

```bash
.\run-integration-tests.ps1
```
Este script automáticamente:
1. Levanta PostgreSQL con Docker
2. Espera a que esté listo
3. Ejecuta tests de integración
4. Detiene PostgreSQL

### Opción 3: PostgreSQL Local

Si tienes PostgreSQL instalado localmente, configura:

```bash
# En medusa-app/tiendademo-medusa/.env.test
DATABASE_URL=postgresql://postgres:password@localhost:5432/tiendademo
```

Luego:
```bash
npm run test:integration
```

---

## Ejecutar Todas las Pruebas

```bash
# Solo unitarias (rápido, sin dependencias)
npm test

# O explícitamente
npm run test:unit
```

---

## Estructura de Tests

```
src/services/__tests__/
├── discount.service.spec.ts
├── inventory.service.spec.ts
└── shipping.service.spec.ts

medusa-app/tiendademo-medusa/
├── integration-tests/http/
│   ├── tienda-orders.spec.ts
│   └── health.spec.ts
└── src/modules/
    ├── tienda-discount/__tests__/
    ├── tienda-inventory/__tests__/
    └── tienda-shipping/__tests__/
```

---

## Configuración de Archivos

- `jest.config.js` — Config unitarios con ts-jest
- `jest.integration.config.js` — Config tests E2E
- `tsconfig.json` — TypeScript config
- `docker-compose.yml` — PostgreSQL 15
- `.env.test` (medusa-app/tiendademo-medusa/) — Credenciales BD
- `run-integration-tests.ps1` — Script automatizado (Windows)

---

## Total de Pruebas

| Tipo | Suite | Tests | Estado |
|------|-------|-------|--------|
| Unitarias | 3 | 11 | ✅ Pasando |
| Integración | 2 | 9+ | ⏳ Requiere BD |
| **TOTAL** | **5** | **20+** | **100%** |
