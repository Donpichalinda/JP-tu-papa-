/**
 * Módulo de Inventario - Tienda Demo
 * 
 * Registra el módulo con MedusaJS v2 usando Module()
 */
import { Module } from "@medusajs/framework/utils"
import TiendaInventoryService from "./service"

export const TIENDA_INVENTORY_MODULE = "tiendaInventory"

export default Module(TIENDA_INVENTORY_MODULE, {
  service: TiendaInventoryService,
})
