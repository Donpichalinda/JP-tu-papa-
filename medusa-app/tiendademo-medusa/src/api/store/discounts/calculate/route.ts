/**
 * POST /store/discounts/calculate
 *
 * Calcula el descuento aplicable a una orden.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const TIENDA_DISCOUNT_MODULE = "tiendaDiscount"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { subtotal, promo_code } = req.body as {
      subtotal: number
      promo_code?: string
    }

    if (subtotal === undefined || subtotal < 0) {
      return res.status(400).json({
        error: "INVALID_REQUEST",
        message: "Debe proporcionar un subtotal válido (número >= 0)",
      })
    }

    const discountService = req.scope.resolve(TIENDA_DISCOUNT_MODULE)
    const result = await discountService.calculateDiscount({ subtotal, promo_code })

    return res.json(result)
  } catch (error: any) {
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error.message,
    })
  }
}
