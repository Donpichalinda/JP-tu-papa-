/**
 * Store Router - Tienda Demo
 *
 * Este archivo define las rutas principales del store de la API.
 * Agrupa las rutas relacionadas con productos, órdenes, descuentos y envío.
 */

import { Router } from "express";
import inventoryRouter from "./inventory";
import discountRouter from "./discount";
import shippingRouter from "./shipping";

const router = Router();

/**
 * Rutas del módulo de inventario
 * Proporciona endpoints para validar stock de productos
 */
router.use("/inventory", inventoryRouter);

/**
 * Rutas del módulo de descuentos
 * Proporciona endpoints para validar y aplicar descuentos
 */
router.use("/discounts", discountRouter);

/**
 * Rutas del módulo de envío
 * Proporciona endpoints para calcular costos de envío
 */
router.use("/shipping", shippingRouter);

export default router;
