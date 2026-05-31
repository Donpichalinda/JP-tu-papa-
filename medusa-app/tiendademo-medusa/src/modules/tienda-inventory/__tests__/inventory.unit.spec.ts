/**
 * ==========================================================
 * PRUEBAS UNITARIAS - Módulo de Inventario (Caja Blanca)
 * ==========================================================
 *
 * Funcionalidad: Validación de Inventario
 * Regla de Negocio: El sistema debe impedir realizar una compra
 * si no hay suficiente stock disponible.
 *
 * Técnicas aplicadas:
 * - Cobertura de sentencia
 * - Cobertura de decisión
 * - Valores límite
 * - Partición de equivalencia
 *
 * Casos de prueba: CP-01 a CP-07
 */

import TiendaInventoryService from "../service"

// Mock de productos en inventario (simula base de datos)
const MOCK_PRODUCTS = [
  {
    id: "inv_001",
    product_id: "laptop_hp",
    nombre: "Laptop HP",
    precio: 1500000,
    stock: 10,
    sku: "LAPTOP-HP-001",
  },
  {
    id: "inv_002",
    product_id: "audifonos_sony",
    nombre: "Audífonos Sony",
    precio: 350000,
    stock: 25,
    sku: "AUDIF-SONY-001",
  },
  {
    id: "inv_003",
    product_id: "teclado_mecanico",
    nombre: "Teclado Mecánico",
    precio: 250000,
    stock: 50,
    sku: "TECLADO-MEC-001",
  },
  {
    id: "inv_004",
    product_id: "monitor_lg",
    nombre: 'Monitor LG 24"',
    precio: 800000,
    stock: 15,
    sku: "MONITOR-LG-001",
  },
  {
    id: "inv_005",
    product_id: "mouse_inalambrico",
    nombre: "Mouse Inalámbrico",
    precio: 80000,
    stock: 100,
    sku: "MOUSE-INAL-001",
  },
]

// Crear instancia mockeada del servicio
function createMockService() {
  const service = Object.create(TiendaInventoryService.prototype)

  // Mock del método listProductInventories (generado por MedusaService)
  service.listProductInventories = jest.fn(async (filter: any) => {
    if (filter?.product_id) {
      const found = MOCK_PRODUCTS.filter(
        (p) => p.product_id === filter.product_id
      )
      return [found]
    }
    return [MOCK_PRODUCTS]
  })

  // Mock del método updateProductInventories
  service.updateProductInventories = jest.fn(async () => ({}))

  return service
}

describe("TiendaInventoryService - Validación de Inventario", () => {
  let service: any

  beforeEach(() => {
    service = createMockService()
  })

  /**
   * CP-01: Compra con stock suficiente
   *
   * Precondición: Producto "laptop_hp" tiene stock = 10
   * Entrada: quantity = 5
   * Resultado esperado: valid = true
   * Técnica: Partición de equivalencia (clase válida)
   * Regla: RN-01.4
   */
  it("CP-01: Debe validar exitosamente cuando hay stock suficiente", async () => {
    const result = await service.validateInventory([
      { product_id: "laptop_hp", quantity: 5 },
    ])

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.validated).toHaveLength(1)
    expect(result.validated[0].product_id).toBe("laptop_hp")
    expect(result.validated[0].quantity).toBe(5)
    expect(result.validated[0].unit_price).toBe(1500000)
    expect(result.validated[0].line_total).toBe(7500000)
  })

  /**
   * CP-02: Compra con stock insuficiente
   *
   * Precondición: Producto "laptop_hp" tiene stock = 10
   * Entrada: quantity = 15
   * Resultado esperado: valid = false, error INSUFFICIENT_STOCK
   * Técnica: Partición de equivalencia (clase inválida)
   * Regla: RN-01.3
   */
  it("CP-02: Debe rechazar cuando el stock es insuficiente", async () => {
    const result = await service.validateInventory([
      { product_id: "laptop_hp", quantity: 15 },
    ])

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error).toBe("INSUFFICIENT_STOCK")
    expect(result.errors[0].requested).toBe(15)
    expect(result.errors[0].available).toBe(10)
    expect(result.errors[0].shortfall).toBe(5)
  })

  /**
   * CP-03: Compra con stock exacto al disponible (valor límite)
   *
   * Precondición: Producto "laptop_hp" tiene stock = 10
   * Entrada: quantity = 10 (exactamente el stock disponible)
   * Resultado esperado: valid = true
   * Técnica: Valor límite (frontera exacta)
   * Regla: RN-01.4
   */
  it("CP-03: Debe aceptar cuando la cantidad es exactamente igual al stock", async () => {
    const result = await service.validateInventory([
      { product_id: "laptop_hp", quantity: 10 },
    ])

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.validated).toHaveLength(1)
    expect(result.validated[0].quantity).toBe(10)
  })

  /**
   * CP-04: Compra con cantidad cero (valor límite inferior)
   *
   * Precondición: Producto existe
   * Entrada: quantity = 0
   * Resultado esperado: valid = false, error INVALID_QTY
   * Técnica: Valor límite (frontera inferior)
   * Regla: RN-01.2
   */
  it("CP-04: Debe rechazar cuando la cantidad es cero", async () => {
    const result = await service.validateInventory([
      { product_id: "laptop_hp", quantity: 0 },
    ])

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error).toBe("INVALID_QTY")
    expect(result.errors[0].message).toContain("mayor a 0")
  })

  /**
   * CP-05: Compra con cantidad negativa
   *
   * Precondición: Producto existe
   * Entrada: quantity = -3
   * Resultado esperado: valid = false, error INVALID_QTY
   * Técnica: Valor límite (fuera de frontera)
   * Regla: RN-01.2
   */
  it("CP-05: Debe rechazar cuando la cantidad es negativa", async () => {
    const result = await service.validateInventory([
      { product_id: "laptop_hp", quantity: -3 },
    ])

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error).toBe("INVALID_QTY")
  })

  /**
   * CP-06: Compra con producto inexistente
   *
   * Precondición: El producto NO existe en el inventario
   * Entrada: product_id = "producto_fantasma"
   * Resultado esperado: valid = false, error NOT_FOUND
   * Técnica: Partición de equivalencia (clase inválida)
   * Regla: RN-01.1
   */
  it("CP-06: Debe rechazar cuando el producto no existe", async () => {
    const result = await service.validateInventory([
      { product_id: "producto_fantasma", quantity: 1 },
    ])

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error).toBe("NOT_FOUND")
    expect(result.errors[0].message).toContain("no existe")
  })

  /**
   * CP-07: Compra múltiple donde un producto falla
   *
   * Precondición: "laptop_hp" stock=10, "mouse_inalambrico" stock=100
   * Entrada: laptop qty=11 (excede), mouse qty=2 (OK)
   * Resultado esperado: valid = false (toda la orden rechazada)
   * Técnica: Condición múltiple / Combinatorio
   * Regla: RN-01.5
   */
  it("CP-07: Debe rechazar toda la orden si un producto no tiene stock suficiente", async () => {
    const result = await service.validateInventory([
      { product_id: "laptop_hp", quantity: 11 },
      { product_id: "mouse_inalambrico", quantity: 2 },
    ])

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].product_id).toBe("laptop_hp")
    expect(result.errors[0].error).toBe("INSUFFICIENT_STOCK")
    // El mouse SÍ se validó correctamente
    expect(result.validated).toHaveLength(1)
    expect(result.validated[0].product_id).toBe("mouse_inalambrico")
  })
})
