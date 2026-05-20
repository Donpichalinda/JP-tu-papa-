/**
 * GET /store/shipping/zones
 *
 * Lista las zonas de envío disponibles.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const TIENDA_SHIPPING_MODULE = "tiendaShipping"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const shippingService = req.scope.resolve(TIENDA_SHIPPING_MODULE)
    const zones = await shippingService.getAvailableZones()

    return res.json({ zones })
  } catch (error: any) {
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: error.message,
    })
  }
}
