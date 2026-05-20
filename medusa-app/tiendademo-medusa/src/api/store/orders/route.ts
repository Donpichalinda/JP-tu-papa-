/**
 * POST /store/orders
 *
 * Crea una nueva orden con:
 * 1. Validación de inventario
 * 2. Cálculo de descuentos
 * 3. Cálculo de costo de envío
 * 4. Creación de la orden
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const TIENDA_INVENTORY_MODULE = "tiendaInventory"
const TIENDA_DISCOUNT_MODULE = "tiendaDiscount"
const TIENDA_SHIPPING_MODULE = "tiendaShipping"

interface OrderItem {
  product_id: string
  quantity: number
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { items, promo_code, zone } = req.body as {
      items: OrderItem[]
      promo_code?: string
      zone?: string
    }

    // 1. Validar items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "INVALID_REQUEST",
        message: "Debe proporcionar items (product_id, quantity)",
      })
    }

    const container = req.scope
    const inventoryService = container.resolve(TIENDA_INVENTORY_MODULE)

    // Validar inventario
    const inventoryResult = await inventoryService.validateInventory(items)

    if (!inventoryResult.valid) {
      return res.status(400).json({
        error: "INVENTORY_VALIDATION_FAILED",
        message: "Inventario insuficiente para procesar la orden",
        ...inventoryResult,
      })
    }

    // 2. Calcular descuentos
    const discountService = container.resolve(TIENDA_DISCOUNT_MODULE)
    const subtotal = inventoryResult.validated.reduce(
      (sum: number, item: any) => sum + item.line_total,
      0
    )
    const discountResult = await discountService.calculateDiscount({
      subtotal,
      promo_code,
    })

    // 3. Calcular costo de envío
    const shippingService = container.resolve(TIENDA_SHIPPING_MODULE)
    const shippingResult = await shippingService.calculateShipping({ zone })

    if (!shippingResult.available) {
      return res.status(400).json({
        error: "SHIPPING_NOT_AVAILABLE",
        message: shippingResult.message,
        shipping: shippingResult,
      })
    }

    // 4. Reservar inventario (reducir stock)
    await inventoryService.reserveInventory(items)

    // 5. Si hay código promo válido, marcar como usado
    if (promo_code && discountResult.promo_valid) {
      await discountService.usePromoCode(promo_code)
    }

    // 6. Crear la orden
    const orderModuleService = container.resolve(Modules.ORDER)

    const order = await orderModuleService.createOrders({
      status: "pending",
      email: "cliente@ejemplo.com",
      shipping_address: {
        address_1: "Dirección de prueba",
        city: "Ciudad",
        country_code: "CO",
      },
      items: inventoryResult.validated.map((item: any) => ({
        title: item.nombre,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })

    const shippingCost = shippingResult.price ?? 0

    return res.status(201).json({
      order,
      inventory: inventoryResult,
      discount: discountResult,
      shipping: shippingResult,
      summary: {
        subtotal,
        discount_amount: discountResult.discount_amount,
        shipping_cost: shippingCost,
        total: subtotal - discountResult.discount_amount + shippingCost,
      },
    })
  } catch (error: any) {
    console.error("Error creating order:", error)
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error.message,
    })
  }
}
