/**
 * API Routes Index - Tienda Demo
 *
 * Este archivo exporta todos los routers de la API.
 * En MedusaJS, las rutas se registran automáticamente desde este archivo.
 */

import { Router } from "express";
import storeRouter from "./store";

const router = Router();

/**
 * Registrar todas las rutas de la API
 */
router.use("/store", storeRouter);

export default router;
