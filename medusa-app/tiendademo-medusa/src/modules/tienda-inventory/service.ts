/**
 * Servicio de Inventario - Tienda Demo (MedusaJS v2)
 *
 * REGLA DE NEGOCIO: El sistema debe impedir realizar una compra si no hay
 * suficiente stock disponible para alguno de los productos solicitados.
 *
 * Lógica implementada:
 * 1. Verificar que cada producto en la orden tenga suficiente stock
 * 2. Si el stock es insuficiente, rechazar la orden con mensaje de error claro
 * 3. Indicar exactamente qué productos tienen stock insuficiente y en qué cantidad
 *
 * CASOS DE PRUEBA SUGERIDOS:
 * - Compra con stock suficiente: La orden debe procesarse correctamente
 * - Compra con stock insuficiente en un producto: Rechazar e indicar cuál
 * - Compra con stock exactamente igual a lo solicitado: Debe procesarse
 * - Compra con cantidad cero o negativa: Debe rechazarse
 * - Compra con múltiples productos donde uno falla: Rechazar toda la orden
 */
import { MedusaService } from "@medusajs/framework/utils"
import ProductInventory from "./models/product-inventory"

class TiendaInventoryService extends MedusaService({
  ProductInventory,
}) {
  /**
   * Valida que el inventario sea suficiente para una orden
   *
   * @param items - Array de items con { product_id, quantity }
   * @returns { valid: boolean, errors: Array, validated: Array }
   */
  async validateInventory(items: { product_id: string; quantity: number }[]) {
    const errors: any[] = []
    const validated: any[] = []

    for (const item of items) {
      // Buscar producto usando el método generado por MedusaService
      const [products] = await this.listProductInventories({
        product_id: item.product_id,
      })

      const product = products?.[0] || (await this.findByProductId(item.product_id))

      if (!product) {
        errors.push({
          product_id: item.product_id,
          error: "NOT_FOUND",
          message: `El producto con ID ${item.product_id} no existe`,
        })
        continue
      }

      if (item.quantity <= 0) {
        errors.push({
          product_id: item.product_id,
          error: "INVALID_QTY",
          message: `La cantidad debe ser mayor a 0`,
        })
        continue
      }

      if (item.quantity > product.stock) {
        errors.push({
          product_id: item.product_id,
          product_title: product.nombre,
          requested: item.quantity,
          available: product.stock,
          shortfall: item.quantity - product.stock,
          error: "INSUFFICIENT_STOCK",
          message: `Stock insuficiente para "${product.nombre}". Solicitado: ${item.quantity}, Disponible: ${product.stock}`,
        })
      } else {
        validated.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product.precio,
          nombre: product.nombre,
          line_total: product.precio * item.quantity,
        })
      }
    }

    return {
      valid: errors.length === 0,
      validated,
      errors,
    }
  }

  /**
   * Busca un producto por su product_id personalizado
   */
  private async findByProductId(productId: string) {
    try {
      const [products] = await this.listProductInventories({
        product_id: productId,
      })
      return products?.[0] || null
    } catch {
      return null
    }
  }

  /**
   * Reserva inventario (reduce stock) para una orden
   */
  async reserveInventory(items: { product_id: string; quantity: number }[]) {
    const results: any[] = []

    for (const item of items) {
      const product = await this.findByProductId(item.product_id)

      if (!product) {
        results.push({
          product_id: item.product_id,
          success: false,
          error: "NOT_FOUND",
        })
        continue
      }

      if (product.stock < item.quantity) {
        results.push({
          product_id: item.product_id,
          success: false,
          error: "INSUFFICIENT_STOCK",
        })
        continue
      }

      // Actualizar stock usando método generado por MedusaService
      await this.updateProductInventories({
        id: product.id,
        stock: product.stock - item.quantity,
      })

      results.push({
        product_id: item.product_id,
        success: true,
        new_quantity: product.stock - item.quantity,
      })
    }

    return {
      success: results.every((r) => r.success),
      results,
    }
  }

  /**
   * Obtiene el stock disponible de un producto
   */
  async getStock(productId: string) {
    const product = await this.findByProductId(productId)
    if (!product) return { product_id: productId, stock: 0, status: "not_found" }

    return {
      product_id: productId,
      stock: product.stock,
      status: product.stock > 5 ? "in_stock" : product.stock > 0 ? "low_stock" : "out_of_stock",
    }
  }
}

export default TiendaInventoryService
