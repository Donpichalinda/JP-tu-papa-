/**
 * POST /store/shipping/calculate
 *
 * Calcula el costo de envío basado en coordenadas o zona.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const TIENDA_SHIPPING_MODULE = "tiendaShipping"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { x, y, zone } = req.body as {
      x?: number
      y?: number
      zone?: string
    }

    const shippingService = req.scope.resolve(TIENDA_SHIPPING_MODULE)
    const result = await shippingService.calculateShipping({ x, y, zone })

    return res.json(result)
  } catch (error: any) {
    return res.status(500).json({
      available: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    })
  }
}
