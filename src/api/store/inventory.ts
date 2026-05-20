/**
 * Inventory API Routes - Tienda Demo
 *
 * Este archivo define los endpoints REST para la validación de inventario.
 *
 * ENDPOINTS:
 * - POST /store/inventory/validate - Valida stock para una orden
 * - GET /store/inventory/:productId - Obtiene stock de un producto
 *
 * REGLA DE NEGOCIO:
 * El sistema debe impedir realizar una compra si no hay suficiente stock
 * disponible para alguno de los productos solicitados.
 */

import { Router } from "express";

const router = Router();

/**
 * POST /store/inventory/validate
 *
 * Valida que el inventario sea suficiente para procesar una orden.
 *
 * Body:
 * {
 *   "items": [
 *     { "product_id": "prod_laptop_hp", "quantity": 2 },
 *     { "product_id": "prod_audifonos_sony", "quantity": 1 }
 *   ]
 * }
 *
 * Respuesta exitosa (200):
 * {
 *   "valid": true,
 *   "items": [...],
 *   "errors": []
 * }
 *
 * Respuesta con error (400):
 * {
 *   "valid": false,
 *   "errors": [
 *     {
 *       "product_id": "prod_laptop_hp",
 *       "requested": 10,
 *       "available": 5,
 *       "shortfall": 5,
 *       "message": "Stock insuficiente..."
 *     }
 *   ]
 * }
 *
 * CASOS DE PRUEBA:
 * - Stock suficiente: Debe retornar valid: true
 * - Stock insuficiente: Debe retornar valid: false con errores detallados
 * - Producto inexistente: Debe retornar error de producto no encontrado
 * - Cantidad inválida (0 o negativa): Debe rechazar la solicitud
 */
router.post("/validate", async (req, res) => {
  try {
    const { items } = req.body;

    // Validar que se proporcionaron items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        valid: false,
        error: "INVALID_REQUEST",
        message: "Debe proporcionar un array de items con product_id y quantity",
      });
    }

    // Validar cada item
    const errors = [];
    const validatedItems = [];

    for (const item of items) {
      // Validar estructura del item
      if (!item.product_id) {
        errors.push({
          error: "MISSING_PRODUCT_ID",
          message: "Cada item debe tener un product_id",
        });
        continue;
      }

      if (!item.quantity || item.quantity <= 0) {
        errors.push({
          product_id: item.product_id,
          error: "INVALID_QUANTITY",
          message: "La cantidad debe ser mayor a 0",
          provided: item.quantity,
        });
        continue;
      }

      /**
       * En un sistema real, aquí se consultaría el servicio de inventario.
       * Para el demo, simulamos la validación.
       *
       * Datos simulados de productos:
       */
      const mockProducts = {
        prod_laptop_hp: { stock: 10, price: 1500000 },
        prod_audifonos_sony: { stock: 25, price: 350000 },
        prod_teclado_mecanico: { stock: 50, price: 250000 },
        prod_monitor_lg: { stock: 15, price: 800000 },
        prod_mouse_inalambrico: { stock: 100, price: 80000 },
      };

      const product = mockProducts[item.product_id];

      if (!product) {
        errors.push({
          product_id: item.product_id,
          error: "PRODUCT_NOT_FOUND",
          message: `Producto con ID "${item.product_id}" no encontrado`,
        });
        continue;
      }

      if (item.quantity > product.stock) {
        errors.push({
          product_id: item.product_id,
          error: "INSUFFICIENT_STOCK",
          requested: item.quantity,
          available: product.stock,
          shortfall: item.quantity - product.stock,
          message: `Stock insuficiente. Solicitado: ${item.quantity}, Disponible: ${product.stock}`,
        });
      } else {
        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          available: product.stock,
          unit_price: product.price,
          total: item.quantity * product.price,
        });
      }
    }

    // Determinar si la validación fue exitosa
    const isValid = errors.length === 0;

    return res.status(isValid ? 200 : 400).json({
      valid: isValid,
      message: isValid
        ? "Inventario válido para procesar la orden"
        : "Inventario insuficiente",
      items: validatedItems,
      errors: errors,
      summary: {
        total_items: items.length,
        validated_items: validatedItems.length,
        failed_items: errors.length,
      },
    });
  } catch (error) {
    console.error("Error validating inventory:", error);
    return res.status(500).json({
      valid: false,
      error: "INTERNAL_ERROR",
      message: "Error interno al validar el inventario",
    });
  }
});

/**
 * GET /store/inventory/:productId
 *
 * Obtiene el stock disponible de un producto específico.
 *
 * Parámetros:
 * - productId: ID del producto a consultar
 *
 * Respuesta:
 * {
 *   "product_id": "prod_laptop_hp",
 *   "available": true,
 *   "quantity": 10,
 *   "status": "in_stock"
 * }
 */
router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    /**
     * Datos simulados de productos
     */
    const mockProducts = {
      prod_laptop_hp: { name: "Laptop HP", stock: 10, price: 1500000 },
      prod_audifonos_sony: { name: "Audífonos Sony", stock: 25, price: 350000 },
      prod_teclado_mecanico: { name: "Teclado Mecánico", stock: 50, price: 250000 },
      prod_monitor_lg: { name: "Monitor LG 24\"", stock: 15, price: 800000 },
      prod_mouse_inalambrico: { name: "Mouse Inalámbrico", stock: 100, price: 80000 },
    };

    const product = mockProducts[productId];

    if (!product) {
      return res.status(404).json({
        product_id: productId,
        available: false,
        error: "PRODUCT_NOT_FOUND",
        message: `Producto con ID "${productId}" no encontrado`,
      });
    }

    // Determinar el estado del stock
    let status;
    if (product.stock === 0) {
      status = "out_of_stock";
    } else if (product.stock < 5) {
      status = "low_stock";
    } else {
      status = "in_stock";
    }

    return res.json({
      product_id: productId,
      name: product.name,
      available: product.stock > 0,
      quantity: product.stock,
      price: product.price,
      status: status,
    });
  } catch (error) {
    console.error("Error getting inventory:", error);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Error interno al obtener el inventario",
    });
  }
});

export default router;
