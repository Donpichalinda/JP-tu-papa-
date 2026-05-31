/**
 * Servicio de Inventario - Tienda Demo
 *
 * Este servicio implementa la lógica de negocio para la validación de inventario.
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

import { BaseService } from "medusa-interactions";

class InventoryService extends BaseService {
  /**
   * Constructor del servicio
   * @param {Object} options - Dependencias inyectadas por Medusa
   */
  constructor(options) {
    super(options);
    this.productModel = options?.productModel;
    this.cartModel = options?.cartModel;
  }

  /**
   * Valida que el inventario sea suficiente para una orden
   *
   * @param {Array} items - Array de items con { variant_id, quantity }
   * @returns {Object} - { valid: boolean, errors: Array, available_items: Array }
   *
   * @example
   * // Ejemplo de uso:
   * const result = await inventoryService.validateInventory([
   *   { variant_id: "prod_laptop_hp", quantity: 2 },
   *   { variant_id: "prod_audifonos_sony", quantity: 1 }
   * ]);
   *
   * // result.valid = true si todos los productos tienen stock
   * // result.errors = [{ product_id, requested, available, shortfall }]
   * // result.available_items = items con quantities ajustadas al máximo disponible
   */
  async validateInventory(items) {
    const errors = [];
    const availableItems = [];

    for (const item of items) {
      // Obtener el producto de la base de datos
      const product = await this.productModel.findOne({
        where: { id: item.variant_id || item.id },
      });

      if (!product) {
        errors.push({
          product_id: item.variant_id || item.id,
          error: "PRODUCT_NOT_FOUND",
          message: `El producto con ID ${item.variant_id || item.id} no existe`,
        });
        continue;
      }

      // Obtener la cantidad disponible (inventario)
      const availableQuantity = product.inventory_quantity || 0;

      // Verificar si la cantidad solicitada está disponible
      if (item.quantity > availableQuantity) {
        errors.push({
          product_id: product.id,
          product_title: product.title,
          requested: item.quantity,
          available: availableQuantity,
          shortfall: item.quantity - availableQuantity,
          error: "INSUFFICIENT_STOCK",
          message: `Stock insuficiente para "${product.title}".
            Solicitado: ${item.quantity},
            Disponible: ${availableQuantity},
            Faltante: ${item.quantity - availableQuantity}`,
        });
      }

      // Agregar a la lista de items disponibles
      availableItems.push({
        variant_id: product.id,
        quantity: Math.min(item.quantity, availableQuantity),
        unit_price: product.price,
        title: product.title,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      available_items: availableItems,
    };
  }

  /**
   * Reserva inventario para una orden
   * Reduce el stock de los productos afectados
   *
   * @param {Array} items - Array de items con { variant_id, quantity }
   * @returns {Object} - Resultado de la operación
   */
  async reserveInventory(items) {
    const results = [];

    for (const item of items) {
      const product = await this.productModel.findOne({
        where: { id: item.variant_id || item.id },
      });

      if (!product) {
        results.push({
          product_id: item.variant_id || item.id,
          success: false,
          error: "PRODUCT_NOT_FOUND",
        });
        continue;
      }

      // Verificar stock antes de reservar
      if (product.inventory_quantity < item.quantity) {
        results.push({
          product_id: product.id,
          success: false,
          error: "INSUFFICIENT_STOCK",
          message: `No hay suficiente stock para ${product.title}`,
        });
        continue;
      }

      // Reducir el inventario
      product.inventory_quantity -= item.quantity;
      await this.productModel.save(product);

      results.push({
        product_id: product.id,
        success: true,
        new_quantity: product.inventory_quantity,
      });
    }

    // Verificar si todas las reservas fueron exitosas
    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      results,
    };
  }

  /**
   * Restaura el inventario de una orden cancelada
   * Incrementa el stock de los productos afectados
   *
   * @param {Array} items - Array de items con { variant_id, quantity }
   */
  async restoreInventory(items) {
    const results = [];

    for (const item of items) {
      const product = await this.productModel.findOne({
        where: { id: item.variant_id || item.id },
      });

      if (!product) {
        results.push({
          product_id: item.variant_id || item.id,
          success: false,
          error: "PRODUCT_NOT_FOUND",
        });
        continue;
      }

      // Restaurar el inventario
      product.inventory_quantity += item.quantity;
      await this.productModel.save(product);

      results.push({
        product_id: product.id,
        success: true,
        new_quantity: product.inventory_quantity,
      });
    }

    return results;
  }

  /**
   * Obtiene el stock disponible de un producto
   *
   * @param {string} productId - ID del producto
   * @returns {number} - Cantidad disponible en inventario
   */
  async getStock(productId) {
    const product = await this.productModel.findOne({
      where: { id: productId },
    });

    return product ? product.inventory_quantity : 0;
  }
}

export default InventoryService;
