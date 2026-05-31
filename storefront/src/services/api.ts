/**
 * API Service - Conexion con el backend Express (server.js)
 * 
 * El backend corre en localhost:3000 y Vite proxea /store -> localhost:3000
 */
const API_BASE = '/store'

export interface Product {
  product_id: string
  nombre: string
  precio: number
  stock: number
  sku?: string
}

export interface ShippingResult {
  available: boolean
  distance?: number
  price?: number
  tariff?: string
  message?: string
  error?: string
  status?: string
}

export interface DiscountResult {
  applies: boolean
  type: string | null
  discount_amount: number
  original_subtotal: number
  final_subtotal: number
  auto_threshold_applies: boolean
  promo_valid?: boolean
  promo_error?: string
  code?: string
}

export interface OrderResult {
  success: boolean
  order: {
    id: string
    created_at: string
    items: any[]
    summary: {
      subtotal: number
      discount: {
        applies: boolean
        type?: string
        code?: string
        amount: number
      }
      subtotal_after_discount: number
      shipping: {
        available: boolean
        distance?: number
        price?: number
      }
      total: number
    }
  }
}

export const api = {
  /**
   * Obtiene la lista de productos desde el backend.
   * GET /store/products -> devuelve { total, productos }
   */
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE}/products`)
      if (!res.ok) throw new Error('Error fetching products')
      const data = await res.json()
      // El backend devuelve { total, productos } con IDs como 'prod_laptop_hp'
      // Mapeamos para que el frontend los use correctamente
      return data.productos.map((p: any) => ({
        product_id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        stock: p.stock,
      }))
    } catch (err) {
      console.error('Error fetching products, using fallback:', err)
      // Fallback con los IDs correctos del backend (incluyen prefijo prod_)
      return [
        { product_id: 'prod_laptop_hp', nombre: 'Laptop HP', precio: 1500000, stock: 10 },
        { product_id: 'prod_audifonos_sony', nombre: 'Audifonos Sony', precio: 350000, stock: 25 },
        { product_id: 'prod_teclado_mecanico', nombre: 'Teclado Mecanico', precio: 250000, stock: 50 },
        { product_id: 'prod_monitor_lg', nombre: 'Monitor LG 24"', precio: 800000, stock: 15 },
        { product_id: 'prod_mouse_inalambrico', nombre: 'Mouse Inalambrico', precio: 80000, stock: 100 },
      ]
    }
  },

  /**
   * Valida inventario para los items del carrito.
   * POST /store/inventory/validate
   */
  async validateInventory(items: { product_id: string; quantity: number }[]) {
    const res = await fetch(`${API_BASE}/inventory/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    return res.json()
  },

  /**
   * Calcula descuentos (automatico por umbral o por codigo promo).
   * POST /store/discounts/calculate
   */
  async calculateDiscount(subtotal: number, promo_code?: string): Promise<DiscountResult> {
    const res = await fetch(`${API_BASE}/discounts/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtotal, promo_code }),
    })
    return res.json()
  },

  /**
   * Valida un codigo promocional.
   * POST /store/discounts/validate
   */
  async validatePromoCode(code: string) {
    const res = await fetch(`${API_BASE}/discounts/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    return res.json()
  },

  /**
   * Obtiene la lista de codigos promocionales disponibles.
   * GET /store/discounts/codes
   */
  async getPromoCodes() {
    const res = await fetch(`${API_BASE}/discounts/codes`)
    return res.json()
  },

  /**
   * Calcula el costo de envio segun la zona.
   * POST /store/shipping/calculate
   */
  async calculateShipping(zone: string): Promise<ShippingResult> {
    const res = await fetch(`${API_BASE}/shipping/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zone }),
    })
    return res.json()
  },

  /**
   * Crea una orden completa con validacion de inventario, descuentos y envio.
   * POST /store/orders
   */
  async createOrder(items: { product_id: string; quantity: number }[], promo_code?: string, zone?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, promo_code, zone }),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      return { success: true, data }
    }
    return { success: false, error: data.error || 'Error al crear la orden' }
  },

  /**
   * Obtiene las zonas de envio disponibles.
   * GET /store/shipping/zones
   */
  async getShippingZones() {
    const res = await fetch(`${API_BASE}/shipping/zones`)
    return res.json()
  },

  /**
   * Obtiene las tarifas de envio.
   * GET /store/shipping/tariffs
   */
  async getShippingTariffs() {
    const res = await fetch(`${API_BASE}/shipping/tariffs`)
    return res.json()
  },
}
