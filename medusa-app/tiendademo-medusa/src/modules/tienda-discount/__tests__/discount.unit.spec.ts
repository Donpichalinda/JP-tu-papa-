/**
 * ==========================================================
 * PRUEBAS UNITARIAS - Módulo de Descuentos (Caja Blanca)
 * ==========================================================
 *
 * Funcionalidad: Lógica de Descuentos
 * Regla de Negocio: Aplicar descuento del 10% bajo ciertas condiciones.
 * Los descuentos NO son acumulables; el código promo tiene prioridad.
 *
 * Técnicas aplicadas:
 * - Cobertura de sentencia y decisión
 * - Cobertura de condición múltiple
 * - Valores límite
 * - Partición de equivalencia
 *
 * Casos de prueba: CP-08 a CP-14
 */

import TiendaDiscountService from "../service"

// Mock de códigos promocionales (simula base de datos)
const MOCK_PROMO_CODES = [
  {
    id: "promo_001",
    codigo: "DESCUENTO10",
    valor: 10,
    descripcion: "10% de descuento en tu compra",
    usos_maximos: null,
    usos_actuales: 0,
  },
  {
    id: "promo_002",
    codigo: "BIENVENIDO",
    valor: 15,
    descripcion: "15% de descuento para nuevos clientes",
    usos_maximos: 100,
    usos_actuales: 0,
  },
  {
    id: "promo_003",
    codigo: "AGOTADO",
    valor: 20,
    descripcion: "Código agotado",
    usos_maximos: 5,
    usos_actuales: 5, // Ya alcanzó el límite
  },
]

// Crear instancia mockeada del servicio
function createMockService() {
  const service = Object.create(TiendaDiscountService.prototype)

  // Mock del método listPromoCodes (generado por MedusaService)
  service.listPromoCodes = jest.fn(async (filter?: any) => {
    if (filter?.codigo) {
      const found = MOCK_PROMO_CODES.filter(
        (p) => p.codigo === filter.codigo
      )
      return [found]
    }
    return [MOCK_PROMO_CODES]
  })

  // Mock del método updatePromoCodes
  service.updatePromoCodes = jest.fn(async () => ({}))

  return service
}

describe("TiendaDiscountService - Lógica de Descuentos", () => {
  let service: any

  beforeEach(() => {
    service = createMockService()
  })

  /**
   * CP-08: Compra < $200.000 sin código promo
   *
   * Precondición: No se proporciona código promo
   * Entrada: subtotal = 150000
   * Resultado esperado: Sin descuento (applies = false)
   * Técnica: Partición de equivalencia (subtotal bajo umbral, sin código)
   * Regla: RN-02.1
   */
  it("CP-08: Sin descuento cuando subtotal < $200.000 y sin código", async () => {
    const result = await service.calculateDiscount({
      subtotal: 150000,
    })

    expect(result.applies).toBe(false)
    expect(result.discount_amount).toBe(0)
    expect(result.final_subtotal).toBe(150000)
    expect(result.auto_threshold_applies).toBe(false)
    expect(result.type).toBeNull()
  })

  /**
   * CP-09: Compra >= $200.000 sin código (descuento automático)
   *
   * Precondición: No se proporciona código promo
   * Entrada: subtotal = 250000
   * Resultado esperado: 10% automático = $25.000 de descuento
   * Técnica: Partición de equivalencia (subtotal sobre umbral)
   * Regla: RN-02.1
   */
  it("CP-09: Descuento automático 10% cuando subtotal >= $200.000", async () => {
    const result = await service.calculateDiscount({
      subtotal: 250000,
    })

    expect(result.applies).toBe(true)
    expect(result.type).toBe("auto_threshold")
    expect(result.discount_amount).toBe(25000) // 10% de 250000
    expect(result.final_subtotal).toBe(225000) // 250000 - 25000
    expect(result.auto_threshold_applies).toBe(true)
  })

  /**
   * CP-10: Compra exactamente $200.000 (valor frontera)
   *
   * Precondición: No se proporciona código promo
   * Entrada: subtotal = 200000 (exactamente el umbral)
   * Resultado esperado: Aplica descuento automático (>=)
   * Técnica: Valor límite (frontera exacta del umbral)
   * Regla: RN-02.1
   */
  it("CP-10: Descuento automático aplica cuando subtotal = $200.000 exacto", async () => {
    const result = await service.calculateDiscount({
      subtotal: 200000,
    })

    expect(result.applies).toBe(true)
    expect(result.type).toBe("auto_threshold")
    expect(result.discount_amount).toBe(20000) // 10% de 200000
    expect(result.final_subtotal).toBe(180000)
    expect(result.auto_threshold_applies).toBe(true)
  })

  /**
   * CP-11: Compra con código "DESCUENTO10" válido (subtotal < $200.000)
   *
   * Precondición: Código DESCUENTO10 existe con valor=10
   * Entrada: subtotal = 100000, promo_code = "DESCUENTO10"
   * Resultado esperado: type = "promo_code", descuento = $10.000
   * Técnica: Partición de equivalencia (código válido + subtotal bajo)
   * Regla: RN-02.2
   */
  it("CP-11: Código promo válido aplica descuento correctamente", async () => {
    const result = await service.calculateDiscount({
      subtotal: 100000,
      promo_code: "DESCUENTO10",
    })

    expect(result.applies).toBe(true)
    expect(result.type).toBe("promo_code")
    expect(result.discount_amount).toBe(10000) // 10% de 100000
    expect(result.final_subtotal).toBe(90000)
    expect(result.code).toBe("DESCUENTO10")
  })

  /**
   * CP-12: No acumulabilidad - código promo + umbral automático
   *
   * Precondición: Código DESCUENTO10 existe. Subtotal supera umbral.
   * Entrada: subtotal = 300000, promo_code = "DESCUENTO10"
   * Resultado esperado: Se aplica SOLO el código promo (tiene prioridad)
   *                     Descuento = 30.000 (10% de 300.000 por código)
   *                     NO se acumula con el automático
   * Técnica: Condición múltiple (ambas condiciones true)
   * Regla: RN-02.3
   */
  it("CP-12: Código promo tiene prioridad sobre descuento automático (no acumulables)", async () => {
    const result = await service.calculateDiscount({
      subtotal: 300000,
      promo_code: "DESCUENTO10",
    })

    expect(result.applies).toBe(true)
    expect(result.type).toBe("promo_code")
    // El código aplica 10% = 30000, NO se acumula con auto 10%
    expect(result.discount_amount).toBe(30000)
    expect(result.final_subtotal).toBe(270000)
    // Verificar que el auto threshold SÍ aplicaría pero no se usa
    expect(result.auto_threshold_applies).toBe(true)
  })

  /**
   * CP-13: Código promocional inválido
   *
   * Precondición: El código NO existe en la base de datos
   * Entrada: code = "CODIGOINEXISTENTE"
   * Resultado esperado: valid = false, error = "INVALID_CODE"
   * Técnica: Partición de equivalencia (clase inválida)
   * Regla: RN-02.4
   */
  it("CP-13: Debe rechazar un código promocional inválido", async () => {
    const result = await service.validatePromoCode("CODIGOINEXISTENTE")

    expect(result.valid).toBe(false)
    expect(result.error).toBe("INVALID_CODE")
  })

  /**
   * CP-14: Código promo case-insensitive
   *
   * Precondición: Código "DESCUENTO10" existe en la base de datos
   * Entrada: code = "descuento10" (minúsculas)
   * Resultado esperado: valid = true, code = "DESCUENTO10"
   * Técnica: Cobertura de sentencia (verifica .toUpperCase())
   * Regla: RN-02.6
   */
  it("CP-14: Códigos promo deben ser case-insensitive", async () => {
    const result = await service.validatePromoCode("descuento10")

    expect(result.valid).toBe(true)
    expect(result.code).toBe("DESCUENTO10")
    expect(result.value).toBe(10)
  })
})
