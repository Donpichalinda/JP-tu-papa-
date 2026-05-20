/**
 * Data Model: ShippingZone
 * 
 * Representa una zona de envío predefinida con coordenadas.
 * Permite calcular la distancia desde la tienda.
 */
import { model } from "@medusajs/framework/utils"

const ShippingZone = model.define("shipping_zone", {
  id: model.id().primaryKey(),
  nombre: model.text().unique(),
  x: model.float(),
  y: model.float(),
})

export default ShippingZone
