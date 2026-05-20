/**
 * Data Model: PromoCode
 * 
 * Representa un código promocional válido en la tienda.
 * Almacena código, valor de descuento, descripción, límites de uso y expiración.
 */
import { model } from "@medusajs/framework/utils"

const PromoCode = model.define("promo_code", {
  id: model.id().primaryKey(),
  codigo: model.text().unique(),
  valor: model.number(),
  descripcion: model.text().default(""),
  usos_maximos: model.number().nullable(),
  usos_actuales: model.number().default(0),
})

export default PromoCode
