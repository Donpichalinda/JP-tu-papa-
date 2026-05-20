/**
 * Data Model: ProductInventory
 * 
 * Representa un producto en el inventario de la tienda demo.
 * Almacena nombre, precio, stock y SKU.
 */
import { model } from "@medusajs/framework/utils"

const ProductInventory = model.define("product_inventory", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(),
  nombre: model.text(),
  precio: model.number(),
  stock: model.number(),
  sku: model.text().default(""),
})

export default ProductInventory
