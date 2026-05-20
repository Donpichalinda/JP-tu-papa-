/**
 * POST /store/discounts/validate
 *
 * Valida un código promocional sin aplicarlo.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const TIENDA_DISCOUNT_MODULE = "tiendaDiscount"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { code } = req.body as { code: string }

    if (!code) {
      return res.status(400).json({
        valid: false,
        error: "MISSING_CODE",
        message: "Debe proporcionar un código promocional",
      })
    }

    const discountService = req.scope.resolve(TIENDA_DISCOUNT_MODULE)
    const result = await discountService.validatePromoCode(code)

    if (!result.valid) {
      return res.status(400).json(result)
    }

    return res.json(result)
  } catch (error: any) {
    return res.status(500).json({
      valid: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    })
  }
}
