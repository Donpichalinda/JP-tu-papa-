/**
 * Módulo de Descuentos - Tienda Demo
 */
import { Module } from "@medusajs/framework/utils"
import TiendaDiscountService from "./service"

export const TIENDA_DISCOUNT_MODULE = "tiendaDiscount"

export default Module(TIENDA_DISCOUNT_MODULE, {
  service: TiendaDiscountService,
})
