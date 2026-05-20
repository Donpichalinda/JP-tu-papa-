/**
 * Módulo de Envío - Tienda Demo
 */
import { Module } from "@medusajs/framework/utils"
import TiendaShippingService from "./service"

export const TIENDA_SHIPPING_MODULE = "tiendaShipping"

export default Module(TIENDA_SHIPPING_MODULE, {
  service: TiendaShippingService,
})
