/**
 * POST /store/inventory/validate
 *
 * Valida que el inventario sea suficiente para procesar una orden.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const TIENDA_INVENTORY_MODULE = "tiendaInventory"

interface ValidateInventoryItem {
  product_id: string
  quantity: number
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { items } = req.body as { items: ValidateInventoryItem[] }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        valid: false,
        error: "INVALID_REQUEST",
        message: "Debe proporcionar un array de items con product_id y quantity",
      })
    }

    const inventoryService = req.scope.resolve(TIENDA_INVENTORY_MODULE)
    const result = await inventoryService.validateInventory(items)

    return res.status(result.valid ? 200 : 400).json(result)
  } catch (error: any) {
    return res.status(500).json({
      valid: false,
      error: "INTERNAL_ERROR",
      message: error.message,
    })
  }
}
