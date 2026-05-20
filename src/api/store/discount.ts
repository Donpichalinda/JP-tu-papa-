/**
 * Discount API Routes - Tienda Demo
 *
 * Este archivo define los endpoints REST para la gestión de descuentos.
 *
 * ENDPOINTS:
 * - POST /store/discounts/calculate - Calcula el descuento aplicable
 * - POST /store/discounts/validate - Valida un código promocional
 * - GET /store/discounts/codes - Lista códigos promocionales disponibles
 *
 * REGLA DE NEGOCIO:
 * Aplicar descuento del 10% bajo las siguientes condiciones:
 * 1. Si el valor total de la compra supera los $200.000 pesos
 * 2. Si se utiliza un código promocional válido (DESCUENTO10, BIENVENIDO)
 *
 * RESTRICCIONES:
 * - Los descuentos no son acumulables
 * - Los códigos promocionales tienen prioridad sobre el descuento automático
 */

import { Router } from "express";

const router = Router();

/**
 * Códigos promocionales válidos (en producción vendrían de la BD)
 */
const VALID_PROMO_CODES = {
  DESCUENTO10: {
    code: "DESCUENTO10",
    type: "percentage",
    value: 10,
    description: "10% de descuento en tu compra",
    usage_limit: null,
    usage_count: 0,
  },
  BIENVENIDO: {
    code: "BIENVENIDO",
    type: "percentage",
    value: 15,
    description: "15% de descuento para nuevos clientes",
    usage_limit: 100,
    usage_count: 0,
  },
};

/**
 * Umbral para descuento automático
 */
const DISCOUNT_THRESHOLD = 200000;
const DISCOUNT_PERCENTAGE = 10;

/**
 * POST /store/discounts/calculate
 *
 * Calcula el descuento aplicable a una orden.
 *
 * Body:
 * {
 *   "subtotal": 500000,
 *   "promo_code": "DESCUENTO10"  // opcional
 * }
 *
 * Respuesta:
 * {
 *   "applies": true,
 *   "type": "auto_threshold" | "promo_code",
 *   "discount_percentage": 10,
 *   "discount_amount": 50000,
 *   "original_subtotal": 500000,
 *   "final_subtotal": 450000,
 *   "message": "..."
 * }
 *
 * CASOS DE PRUEBA:
 * - Compra < $200.000 sin código: Sin descuento
 * - Compra > $200.000 sin código: 10% de descuento automático
 * - Compra < $200.000 con código válido: 10% de descuento por código
 * - Compra > $200.000 con código válido: Descuento por código (prioridad)
 * - Compra con código inválido: Rechazo del código pero aplica automático si corresponde
 * - Compra con código expirado: Rechazo del código
 */
router.post("/calculate", async (req, res) => {
  try {
    const { subtotal, promo_code } = req.body;

    // Validar que se proporcionó el subtotal
    if (subtotal === undefined || subtotal < 0) {
      return res.status(400).json({
        error: "INVALID_REQUEST",
        message: "Debe proporcionar un subtotal válido (número >= 0)",
      });
    }

    // Resultado inicial (sin descuento)
    const result = {
      applies: false,
      type: null,
      discount_percentage: 0,
      discount_amount: 0,
      original_subtotal: subtotal,
      final_subtotal: subtotal,
      promo_code: null,
      promo_code_valid: false,
      auto_threshold_applies: false,
      message: "",
    };

    // Calcular el descuento automático si el monto supera el umbral
    const autoThresholdApplies = subtotal >= DISCOUNT_THRESHOLD;
    const autoDiscountAmount = autoThresholdApplies
      ? Math.floor(subtotal * (DISCOUNT_PERCENTAGE / 100))
      : 0;

    result.auto_threshold_applies = autoThresholdApplies;
    result.auto_threshold = DISCOUNT_THRESHOLD;
    result.auto_discount_amount_if_applied = autoDiscountAmount;

    // Procesar código promocional si se proporcionó
    let promoDiscountAmount = 0;
    let promoError = null;

    if (promo_code) {
      const promo = VALID_PROMO_CODES[promo_code.toUpperCase()];

      if (!promo) {
        promoError = {
          code: "INVALID_CODE",
          message: `El código promocional "${promo_code}" no es válido`,
        };
      } else if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        promoError = {
          code: "USAGE_LIMIT_REACHED",
          message: `El código promocional "${promo_code}" ha alcanzado su límite de usos`,
        };
      } else {
        // Código válido - calcular descuento
        promoDiscountAmount = Math.floor(subtotal * (promo.value / 100));
        result.promo_code = promo.code;
        result.promo_code_valid = true;
        result.promo_description = promo.description;
      }
    }

    // Determinar qué descuento aplicar (el de código tiene prioridad)
    if (promoDiscountAmount > 0) {
      result.applies = true;
      result.type = "promo_code";
      result.discount_percentage = VALID_PROMO_CODES[promo_code.toUpperCase()].value;
      result.discount_amount = promoDiscountAmount;
      result.message = `Código promocional "${promo_code}" aplicado: ${result.discount_percentage}% de descuento`;
    } else if (autoThresholdApplies) {
      result.applies = true;
      result.type = "auto_threshold";
      result.discount_percentage = DISCOUNT_PERCENTAGE;
      result.discount_amount = autoDiscountAmount;
      result.message = `Descuento automático: Compras superiores a $${DISCOUNT_THRESHOLD.toLocaleString()} reciben ${DISCOUNT_PERCENTAGE}% de descuento`;
    }

    // Incluir error de promo code si existe
    if (promoError) {
      result.promo_error = promoError.code;
      result.promo_message = promoError.message;
    }

    result.final_subtotal = subtotal - result.discount_amount;

    return res.json(result);
  } catch (error) {
    console.error("Error calculating discount:", error);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Error interno al calcular el descuento",
    });
  }
});

/**
 * POST /store/discounts/validate
 *
 * Valida un código promocional sin aplicarlo.
 *
 * Body:
 * {
 *   "code": "DESCUENTO10"
 * }
 *
 * Respuesta exitosa:
 * {
 *   "valid": true,
 *   "code": "DESCUENTO10",
 *   "type": "percentage",
 *   "value": 10,
 *   "description": "10% de descuento en tu compra"
 * }
 *
 * Respuesta fallida:
 * {
 *   "valid": false,
 *   "error": "INVALID_CODE",
 *   "message": "El código promocional no es válido"
 * }
 */
router.post("/validate", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        error: "MISSING_CODE",
        message: "Debe proporcionar un código promocional",
      });
    }

    const promo = VALID_PROMO_CODES[code.toUpperCase()];

    if (!promo) {
      return res.status(404).json({
        valid: false,
        code: code,
        error: "INVALID_CODE",
        message: `El código promocional "${code}" no es válido`,
      });
    }

    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return res.status(410).json({
        valid: false,
        code: code,
        error: "USAGE_LIMIT_REACHED",
        message: `El código promocional "${code}" ha alcanzado su límite de usos`,
      });
    }

    return res.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      description: promo.description,
      remaining_uses: promo.usage_limit ? promo.usage_limit - promo.usage_count : null,
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return res.status(500).json({
      valid: false,
      error: "INTERNAL_ERROR",
      message: "Error interno al validar el código promocional",
    });
  }
});

/**
 * GET /store/discounts/codes
 *
 * Lista todos los códigos promocionales disponibles.
 *
 * Respuesta:
 * {
 *   "codes": [
 *     { "code": "DESCUENTO10", "description": "...", "available": true },
 *     { "code": "BIENVENIDO", "description": "...", "available": true }
 *   ]
 * }
 */
router.get("/codes", async (req, res) => {
  const codes = Object.values(VALID_PROMO_CODES).map((promo) => ({
    code: promo.code,
    description: promo.description,
    type: promo.type,
    value: promo.value,
    available: !promo.usage_limit || promo.usage_count < promo.usage_limit,
    remaining_uses: promo.usage_limit
      ? promo.usage_limit - promo.usage_count
      : null,
  }));

  return res.json({ codes });
});

export default router;
