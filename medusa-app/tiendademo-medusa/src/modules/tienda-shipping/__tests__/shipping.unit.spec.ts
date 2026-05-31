/**
 * ==========================================================
 * PRUEBAS UNITARIAS - Módulo de Envío (Caja Blanca + Caja Negra)
 * ==========================================================
 *
 * Funcionalidad: Cálculo de Costo de Envío
 * Regla de Negocio: El costo de envío depende de la distancia al cliente.
 *
 * Tarifas:
 * - Distancia < 5 km: $5.000 (Envío Express)
 * - Distancia >= 5 km y <= 10 km: $10.000 (Envío Estándar)
 * - Distancia > 10 km: RECHAZAR la compra
 *
 * Técnicas aplicadas:
 * - Cobertura de decisión (3 ramas del if-else)
 * - Valores límite (fronteras 5km y 10km)
 * - Partición de equivalencia (3 particiones de distancia)
 *
 * Casos de prueba: CP-15 a CP-18
 */

import TiendaShippingService from "../service"

// Mock de zonas de envío (simula base de datos)
const MOCK_ZONES = [
  { id: "zone_001", nombre: "CENTRO", x: 3, y: 2 },       // dist = sqrt(13) ≈ 3.61 km
  { id: "zone_002", nombre: "NORTE", x: 6, y: 4 },        // dist = sqrt(52) ≈ 7.21 km
  { id: "zone_003", nombre: "SUR", x: 10, y: 8 },         // dist = sqrt(164) ≈ 12.81 km
  { id: "zone_004", nombre: "OCCIDENTE", x: 2, y: 0 },    // dist = sqrt(4) = 2 km
  { id: "zone_005", nombre: "ORIENTE", x: 7, y: 4 },      // dist = sqrt(65) ≈ 8.06 km
]

// Crear instancia mockeada del servicio
function createMockService() {
  const service = Object.create(TiendaShippingService.prototype)

  // Mock del método listShippingZones (generado por MedusaService)
  service.listShippingZones = jest.fn(async (filter?: any) => {
    if (filter?.nombre) {
      const found = MOCK_ZONES.filter(
        (z) => z.nombre === filter.nombre
      )
      return [found]
    }
    return [MOCK_ZONES]
  })

  return service
}

describe("TiendaShippingService - Cálculo de Costo de Envío", () => {
  let service: any

  beforeEach(() => {
    service = createMockService()
  })

  /**
   * CP-15: Envío zona CENTRO (distancia < 5 km → Envío Express)
   *
   * Precondición: Zona CENTRO existe con coordenadas (3, 2)
   * Entrada: zone = "CENTRO"
   * Cálculo: sqrt(3² + 2²) = sqrt(13) ≈ 3.61 km
   * Resultado esperado: available = true, price = 5000, tariff = "Envio Express"
   * Técnica: Partición de equivalencia (distancia corta < 5 km)
   * Regla: RN-03.1
   */
  it("CP-15: Envío Express para zona CENTRO (dist ~3.61 km < 5 km)", async () => {
    const result = await service.calculateShipping({ zone: "CENTRO" })

    expect(result.available).toBe(true)
    expect(result.price).toBe(5000)
    expect(result.tariff).toBe("Envio Express")
    expect(result.distance).toBeCloseTo(3.61, 1)
  })

  /**
   * CP-16: Envío zona NORTE (distancia entre 5 y 10 km → Envío Estándar)
   *
   * Precondición: Zona NORTE existe con coordenadas (6, 4)
   * Entrada: zone = "NORTE"
   * Cálculo: sqrt(6² + 4²) = sqrt(52) ≈ 7.21 km
   * Resultado esperado: available = true, price = 10000, tariff = "Envio Estandar"
   * Técnica: Partición de equivalencia (distancia media 5-10 km)
   * Regla: RN-03.2
   */
  it("CP-16: Envío Estándar para zona NORTE (dist ~7.21 km, entre 5 y 10)", async () => {
    const result = await service.calculateShipping({ zone: "NORTE" })

    expect(result.available).toBe(true)
    expect(result.price).toBe(10000)
    expect(result.tariff).toBe("Envio Estandar")
    expect(result.distance).toBeCloseTo(7.21, 1)
  })

  /**
   * CP-17: Envío zona SUR (distancia > 10 km → RECHAZADA)
   *
   * Precondición: Zona SUR existe con coordenadas (10, 8)
   * Entrada: zone = "SUR"
   * Cálculo: sqrt(10² + 8²) = sqrt(164) ≈ 12.81 km
   * Resultado esperado: available = false, envío rechazado
   * Técnica: Partición de equivalencia (distancia excesiva > 10 km)
   * Regla: RN-03.3
   */
  it("CP-17: Envío RECHAZADO para zona SUR (dist ~12.81 km > 10 km)", async () => {
    const result = await service.calculateShipping({ zone: "SUR" })

    expect(result.available).toBe(false)
    expect(result.status).toBe("rejected")
    expect(result.distance).toBeCloseTo(12.81, 1)
    expect(result.message).toContain("No se puede enviar")
    expect(result.message).toContain("10")
  })

  /**
   * CP-18: Envío con zona inexistente
   *
   * Precondición: La zona "NOEXISTE" no está registrada
   * Entrada: zone = "NOEXISTE"
   * Resultado esperado: available = false, error = "ZONE_NOT_FOUND"
   * Técnica: Partición de equivalencia (clase inválida - zona no registrada)
   * Regla: RN-03.6
   */
  it("CP-18: Debe rechazar con ZONE_NOT_FOUND para zona inexistente", async () => {
    const result = await service.calculateShipping({ zone: "NOEXISTE" })

    expect(result.available).toBe(false)
    expect(result.error).toBe("ZONE_NOT_FOUND")
    expect(result.message).toContain("no está definida")
  })
})
