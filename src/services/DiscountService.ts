/**
 * Servicio de Descuentos - Tienda Demo
 *
 * Este servicio implementa la lógica de negocio para aplicar descuentos.
 *
 * REGLA DE NEGOCIO: Aplicar descuento del 10% bajo las siguientes condiciones:
 * 1. Si el valor total de la compra supera los $200.000 pesos
 * 2. Si se utiliza un código promocional válido (DESCUENTO10)
 *
 * RESTRICCIONES:
 * - Los descuentos no son acumulables (solo se aplica uno)
 * - El descuento automático (por monto) tiene prioridad sobre códigos
 * - Los códigos promocionales tienen prioridad sobre el descuento automático
 *
 * Lógica implementada:
 * 1. Calcular el subtotal de la orden
 * 2. Verificar si aplica descuento automático (> $200.000)
 * 3. Si hay código promocional, validar y aplicar
 * 4. Retornar el descuento aplicable (el mayor de los dos si aplica)
 *
 * CASOS DE PRUEBA SUGERIDOS:
 * - Compra < $200.000 sin código: Sin descuento
 * - Compra > $200.000 sin código: 10% de descuento
 * - Compra < $200.000 con código válido: 10% de descuento
 * - Compra > $200.000 con código válido: 10% de descuento (no acumulable)
 * - Compra con código inválido: Rechazar el código
 * - Compra con código expirado: Rechazar el código
 * - Compra con monto exactamente $200.000: Aplicar descuento
 */

import { BaseService } from "medusa-interactions";

class DiscountService extends BaseService {
  /**
   * Umbral para aplicar descuento automático
   * Si el subtotal supera este monto, se aplica 10% de descuento
   */
  static DISCOUNT_THRESHOLD = 200000;

  /**
   * Porcentaje de descuento a aplicar
   * Representa el 10% de descuento
   */
  static DISCOUNT_PERCENTAGE = 10;

  /**
   * Códigos promocionales válidos
   * En un sistema real, estos se almacenarían en la base de datos
   */
  static VALID_PROMO_CODES = {
    DESCUENTO10: {
      code: "DESCUENTO10",
      type: "percentage",
      value: 10,
      description: "10% de descuento en tu compra",
      expires_at: null, // Sin fecha de expiración
      usage_limit: null, // Sin límite de usos
      usage_count: 0,
    },
    BIENVENIDO: {
      code: "BIENVENIDO",
      type: "percentage",
      value: 15,
      description: "15% de descuento para nuevos clientes",
      expires_at: null,
      usage_limit: 100,
      usage_count: 0,
    },
  };

  /**
   * Constructor del servicio
   * @param {Object} options - Dependencias inyectadas por Medusa
   */
  constructor({ discountModel, cartModel }) {
    super(options);
    this.discountModel = discountModel;
    this.cartModel = cartModel;
  }

  /**
   * Calcula el descuento aplicable a una orden
   *
   * @param {Object} params - Parámetros de la orden
   * @param {number} params.subtotal - Subtotal de la orden (sin descuentos ni envío)
   * @param {string} params.promo_code - Código promocional (opcional)
   * @returns {Object} - Información del descuento aplicable
   *
   * @example
   * // Ejemplo 1: Compra alta sin código
   * const result1 = await discountService.calculateDiscount({
   *   subtotal: 500000,
   *   promo_code: null
   * });
   * // result1.applies = true
   * // result1.type = "auto_threshold"
   * // result1.discount_amount = 50000 (10% de 500000)
   *
   * @example
   * // Ejemplo 2: Compra baja con código válido
   * const result2 = await discountService.calculateDiscount({
   *   subtotal: 100000,
   *   promo_code: "DESCUENTO10"
   * });
   * // result2.applies = true
   * // result2.type = "promo_code"
   * // result2.discount_amount = 10000 (10% de 100000)
   */
  calculateDiscount({ subtotal, promo_code }) {
    const result = {
      applies: false,
      type: null,
      discount_amount: 0,
      original_subtotal: subtotal,
      final_subtotal: subtotal,
      message: "",
      promo_code_valid: false,
    };

    // Verificar descuento automático por umbral de monto
    const autoDiscountApplies = subtotal >= DiscountService.DISCOUNT_THRESHOLD;
    const autoDiscountAmount = Math.floor(
      subtotal * (DiscountService.DISCOUNT_PERCENTAGE / 100)
    );

    // Verificar código promocional
    let promoDiscountAmount = 0;
    let promoDiscountType = null;

    if (promo_code) {
      const promoValidation = this.validatePromoCode(promo_code);

      if (promoValidation.valid) {
        promoDiscountType = promoValidation.type;
        promoDiscountAmount = Math.floor(
          subtotal * (promoValidation.value / 100)
        );
        result.promo_code_valid = true;
        result.promo_code = promo_code;
        result.promo_description = promoValidation.description;
      } else {
        result.promo_error = promoValidation.error;
        result.promo_message = promoValidation.message;
      }
    }

    /**
     * Lógica de prioridad: El descuento por código promocional tiene prioridad
     * sobre el descuento automático por monto. Esto evita confusiones
     * donde el cliente ve "descuento por monto" y luego intenta usar un código.
     *
     * Alternativamente, podría tomar el descuento MAYOR de los dos.
     */
    if (promo_code && promoDiscountAmount > 0) {
      result.applies = true;
      result.type = "promo_code";
      result.discount_amount = promoDiscountAmount;
      result.message = `Código promocional "${promo_code}" aplicado: ${DiscountService.DISCOUNT_PERCENTAGE}% de descuento`;
    } else if (autoDiscountApplies) {
      result.applies = true;
      result.type = "auto_threshold";
      result.discount_amount = autoDiscountAmount;
      result.message = `Descuento automático aplicado: Compras superiores a $${DiscountService.DISCOUNT_THRESHOLD.toLocaleString()} recibe ${DiscountService.DISCOUNT_PERCENTAGE}% de descuento`;
    }

    // Calcular el subtotal final después del descuento
    result.final_subtotal = subtotal - result.discount_amount;

    return result;
  }

  /**
   * Valida un código promocional
   *
   * @param {string} code - Código promocional a validar
   * @returns {Object} - Resultado de la validación
   */
  validatePromoCode(code) {
    const promoCode = DiscountService.VALID_PROMO_CODES[code.toUpperCase()];

    // Verificar si el código existe
    if (!promoCode) {
      return {
        valid: false,
        error: "INVALID_CODE",
        message: `El código promocional "${code}" no es válido`,
      };
    }

    // Verificar si el código ha expirado
    if (
      promoCode.expires_at &&
      new Date(promoCode.expires_at) < new Date()
    ) {
      return {
        valid: false,
        error: "EXPIRED_CODE",
        message: `El código promocional "${code}" ha expirado`,
      };
    }

    // Verificar si el código tiene usos limitados y si se alcanzó el límite
    if (
      promoCode.usage_limit &&
      promoCode.usage_count >= promoCode.usage_limit
    ) {
      return {
        valid: false,
        error: "USAGE_LIMIT_REACHED",
        message: `El código promocional "${code}" ha alcanzado su límite de usos`,
      };
    }

    return {
      valid: true,
      type: promoCode.type,
      value: promoCode.value,
      description: promoCode.description,
    };
  }

  /**
   * Obtiene todos los códigos promocionales disponibles
   * Útil para el panel de administración
   *
   * @returns {Array} - Lista de códigos promocionales
   */
  getAvailablePromoCodes() {
    return Object.values(DiscountService.VALID_PROMO_CODES).map(
      (promo) => ({
        code: promo.code,
        description: promo.description,
        type: promo.type,
        value: promo.value,
        expires_at: promo.expires_at,
        available: !promo.expires_at ||
          new Date(promo.expires_at) > new Date(),
      })
    );
  }

  /**
   * Aplica un código promocional a una orden (lo marca como usado)
   *
   * @param {string} code - Código a utilizar
   * @returns {Object} - Resultado de la operación
   */
  usePromoCode(code) {
    const promoCode = DiscountService.VALID_PROMO_CODES[code.toUpperCase()];

    if (promoCode) {
      promoCode.usage_count++;
    }

    return {
      success: true,
      code: code.toUpperCase(),
      usage_count: promoCode?.usage_count || 0,
    };
  }
}

export default DiscountService;
