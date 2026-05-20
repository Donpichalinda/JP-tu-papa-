/**
 * Shipping API Routes - Tienda Demo
 *
 * ENDPOINTS:
 * - POST /store/shipping/calculate - Calcula costo de envío
 * - GET /store/shipping/zones - Lista zonas disponibles
 * - GET /store/shipping/tariffs - Lista tarifas
 *
 * REGLA DE NEGOCIO:
 * - Distancia < 5 km: $5.000 pesos
 * - Distancia 5-10 km: $10.000 pesos
 * - Distancia > 10 km: RECHAZADO
 */

import { Router } from "express";

const router = Router();

/**
 * Tarifas de envío
 */
const TARIFFS = {
  SHORT: { max_distance: 5, price: 5000, name: "Envío Express" },
  MEDIUM: { min_distance: 5, max_distance: 10, price: 10000, name: "Envío Estándar" },
};

const MAX_DISTANCE = 10;

/**
 * Zonas predefinidas
 */
const ZONES = {
  CENTRO: { x: 3, y: 2 },
  NORTE: { x: 6, y: 4 },
  SUR: { x: 10, y: 8 },
  OCCIDENTE: { x: 2, y: 0 },
  ORIENTE: { x: 7, y: 4 },
};

/**
 * Calcula distancia euclidiana
 */
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * POST /store/shipping/calculate
 *
 * Body: { "x": 3, "y": 4 } o { "zone": "NORTE" }
 *
 * CASOS DE PRUEBA:
 * - 3 km: $5.000 (SHORT)
 * - 7 km: $10.000 (MEDIUM)
 * - 12 km: RECHAZADO
 */
router.post("/calculate", async (req, res) => {
  try {
    const { x, y, zone } = req.body;

    let targetX = x;
    let targetY = y;

    if (zone) {
      const zoneData = ZONES[zone.toUpperCase()];
      if (!zoneData) {
        return res.status(400).json({
          available: false,
          error: "ZONE_NOT_FOUND",
          message: `Zona "${zone}" no válida. Zonas: ${Object.keys(ZONES).join(", ")}`,
        });
      }
      targetX = zoneData.x;
      targetY = zoneData.y;
    }

    if (targetX === undefined || targetY === undefined) {
      return res.status(400).json({
        available: false,
        error: "MISSING_LOCATION",
        message: "Proporcione coordenadas (x, y) o zona",
      });
    }

    const distance = Math.round(calculateDistance(0, 0, targetX, targetY) * 100) / 100;

    let result = {
      available: false,
      distance,
      price: 0,
      status: "rejected",
      error: "DISTANCE_EXCEEDED",
      message: `No se puede enviar a ${distance} km. Máximo: ${MAX_DISTANCE} km`,
    };

    if (distance < TARIFFS.SHORT.max_distance) {
      result = {
        available: true,
        distance,
        price: TARIFFS.SHORT.price,
        status: "available",
        tariff: TARIFFS.SHORT.name,
        message: `Envío a ${distance} km: ${TARIFFS.SHORT.name}`,
      };
    } else if (distance <= TARIFFS.MEDIUM.max_distance) {
      result = {
        available: true,
        distance,
        price: TARIFFS.MEDIUM.price,
        status: "available",
        tariff: TARIFFS.MEDIUM.name,
        message: `Envío a ${distance} km: ${TARIFFS.MEDIUM.name}`,
      };
    }

    return res.json(result);
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

/**
 * GET /store/shipping/zones
 * Lista zonas y disponibilidad de envío
 */
router.get("/zones", async (req, res) => {
  const zonesList = Object.entries(ZONES).map(([name, coords]) => {
    const distance = Math.round(calculateDistance(0, 0, coords.x, coords.y) * 100) / 100;
    const available = distance <= MAX_DISTANCE;
    return { zone: name, distance, available };
  });
  return res.json({ zones: zonesList });
});

/**
 * GET /store/shipping/tariffs
 * Lista tarifas definidas
 */
router.get("/tariffs", async (req, res) => {
  return res.json({ tariffs: TARIFFS, max_distance: MAX_DISTANCE });
});

export default router;
