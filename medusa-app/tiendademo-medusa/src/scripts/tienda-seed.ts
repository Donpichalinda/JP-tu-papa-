/**
 * Seed Script - Tienda Demo
 *
 * Seed data for:
 * - ProductInventory (productos con stock)
 * - PromoCode (códigos promocionales)
 * - ShippingZone (zonas de envío)
 *
 * Run with: npx medusa exec ./src/scripts/tienda-seed.ts
 */
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { TIENDA_INVENTORY_MODULE } from "../modules/tienda-inventory"
import { TIENDA_DISCOUNT_MODULE } from "../modules/tienda-discount"
import { TIENDA_SHIPPING_MODULE } from "../modules/tienda-shipping"

// Avoid strict TS type dependency in integration runner environment
export default async function seedTiendaDemoData(args: any) {
  const { container } = args || {};
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Resolver servicios de los módulos
  const inventoryModule = container.resolve(TIENDA_INVENTORY_MODULE)
  const discountModule = container.resolve(TIENDA_DISCOUNT_MODULE)
  const shippingModule = container.resolve(TIENDA_SHIPPING_MODULE)

  logger.info("Seeding Tienda Demo inventory data...")

  // 1. Seed ProductInventory (productos demo)
  const demoProducts = [
    {
      product_id: "laptop_hp",
      nombre: "Laptop HP",
      precio: 1500000,
      stock: 10,
      sku: "LAPTOP-HP-001",
    },
    {
      product_id: "audifonos_sony",
      nombre: "Audífonos Sony",
      precio: 350000,
      stock: 25,
      sku: "AUDIF-SONY-001",
    },
    {
      product_id: "teclado_mecanico",
      nombre: "Teclado Mecánico",
      precio: 250000,
      stock: 50,
      sku: "TECLADO-MEC-001",
    },
    {
      product_id: "monitor_lg",
      nombre: "Monitor LG 24\"",
      precio: 800000,
      stock: 15,
      sku: "MONITOR-LG-001",
    },
    {
      product_id: "mouse_inalambrico",
      nombre: "Mouse Inalámbrico",
      precio: 80000,
      stock: 100,
      sku: "MOUSE-INAL-001",
    },
  ]

  for (const product of demoProducts) {
    try {
      await inventoryModule.createProductInventories(product)
      logger.info(`Created product: ${product.nombre}`)
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.code === "DUPLICATE_ERROR") {
        logger.info(`Product already exists: ${product.nombre}`)
      } else {
        logger.error(`Error creating product ${product.nombre}: ${error.message}`)
      }
    }
  }

  logger.info("Seeding Tienda Demo promo codes...")

  // 2. Seed PromoCode (códigos promocionales demo)
  const demoPromoCodes = [
    {
      codigo: "DESCUENTO10",
      valor: 10,
      descripcion: "10% de descuento en tu compra",
    },
    {
      codigo: "BIENVENIDO",
      valor: 15,
      descripcion: "15% de descuento para nuevos clientes",
    },
  ]

  for (const promo of demoPromoCodes) {
    try {
      await discountModule.createPromoCodes({
        ...promo,
        usos_maximos: null,
        usos_actuales: 0,
      })
      logger.info(`Created promo code: ${promo.codigo}`)
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.code === "DUPLICATE_ERROR") {
        logger.info(`Promo code already exists: ${promo.codigo}`)
      } else {
        logger.error(`Error creating promo code ${promo.codigo}: ${error.message}`)
      }
    }
  }

  logger.info("Seeding Tienda Demo shipping zones...")

  // 3. Seed ShippingZone (zonas de envío demo)
  const demoZones = [
    { nombre: "CENTRO", x: 3, y: 2 },
    { nombre: "NORTE", x: 6, y: 4 },
    { nombre: "SUR", x: 10, y: 8 },
    { nombre: "OCCIDENTE", x: 2, y: 0 },
    { nombre: "ORIENTE", x: 7, y: 4 },
  ]

  for (const zone of demoZones) {
    try {
      await shippingModule.createShippingZones(zone)
      logger.info(`Created shipping zone: ${zone.nombre}`)
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.code === "DUPLICATE_ERROR") {
        logger.info(`Shipping zone already exists: ${zone.nombre}`)
      } else {
        logger.error(`Error creating shipping zone ${zone.nombre}: ${error.message}`)
      }
    }
  }

  logger.info("Tienda Demo seed completed successfully!")
}
