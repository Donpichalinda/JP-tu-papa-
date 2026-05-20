/**
 * Servicio de Descuentos - Tienda Demo (MedusaJS v2)
 *
 * REGLA DE NEGOCIO: Aplicar descuento del 10% bajo ciertas condiciones.
 *
 * Condiciones:
 * - Si el valor total de la compra supera los $200.000, aplicar 10% automáticamente
 * - Si se utiliza un código promocional válido, aplicar su descuento
 * - Los descuentos NO son acumulables (código promo tiene prioridad)
 *
 * CASOS DE PRUEBA SUGERIDOS:
 * - Compra < $200.000 sin código: Sin descuento
 * - Compra > $200.000 sin código: 10% de descuento automático
 * - Compra < $200.000 con código válido: descuento del código
 * - Compra > $200.000 con código válido: Código tiene prioridad
 * - Compra con código inválido: Rechazar el código
 */
import { MedusaService } from "@medusajs/framework/utils"
import PromoCode from "./models/promo-code"

class TiendaDiscountService extends MedusaService({
  PromoCode,
}) {
  /**
   * Umbral para descuento automático
   */
  static DISCOUNT_THRESHOLD = 200000

  /**
   * Porcentaje de descuento automático
   */
  static DISCOUNT_PERCENTAGE = 10

  /**
   * Calcula el descuento aplicable a una orden
   */
  async calculateDiscount({ subtotal, promo_code }: { subtotal: number; promo_code?: string }) {
    const result: any = {
      applies: false,
      type: null,
      discount_amount: 0,
      original_subtotal: subtotal,
      final_subtotal: subtotal,
      auto_threshold_applies: false,
      promo_code_valid: false,
    }

    // Verificar descuento automático por umbral
    const autoApplies = subtotal >= TiendaDiscountService.DISCOUNT_THRESHOLD
    const autoAmount = autoApplies
      ? Math.floor(subtotal * TiendaDiscountService.DISCOUNT_PERCENTAGE / 100)
      : 0
    result.auto_threshold_applies = autoApplies

    // Verificar código promocional
    let promoAmount = 0
    if (promo_code) {
      const validation = await this.validatePromoCode(promo_code)

      if (validation.valid) {
        promoAmount = Math.floor(subtotal * validation.value! / 100)
        result.applies = true
        result.type = "promo_code"
        result.code = validation.code
        result.discount_amount = promoAmount
        result.promo_valid = true
      } else {
        result.promo_error = validation.error
      }
    } else if (autoApplies) {
      result.applies = true
      result.type = "auto_threshold"
      result.discount_amount = autoAmount
    }

    result.final_subtotal = subtotal - result.discount_amount
    return result
  }

  /**
   * Valida un código promocional
   */
  async validatePromoCode(code: string): Promise<{
    valid: boolean
    error?: string
    code?: string
    value?: number
    description?: string
  }> {
    try {
      const [promoCodes] = await this.listPromoCodes({
        codigo: code.toUpperCase(),
      })

      const promo = promoCodes?.[0]

      if (!promo) {
        return { valid: false, error: "INVALID_CODE" }
      }

      // Verificar límite de usos
      if (promo.usos_maximos && promo.usos_actuales >= promo.usos_maximos) {
        return { valid: false, error: "USAGE_LIMIT_REACHED" }
      }

      return {
        valid: true,
        code: promo.codigo,
        value: promo.valor,
        description: promo.descripcion,
      }
    } catch {
      return { valid: false, error: "INVALID_CODE" }
    }
  }

  /**
   * Marca un código promocional como usado (incrementa contador)
   */
  async usePromoCode(code: string) {
    const [promoCodes] = await this.listPromoCodes({
      codigo: code.toUpperCase(),
    })
    const promo = promoCodes?.[0]

    if (promo) {
      await this.updatePromoCodes({
        id: promo.id,
        usos_actuales: promo.usos_actuales + 1,
      })
    }

    return {
      success: true,
      code: code.toUpperCase(),
      usage_count: promo ? promo.usos_actuales + 1 : 0,
    }
  }

  /**
   * Obtiene todos los códigos promocionales disponibles
   */
  async getAvailablePromoCodes() {
    const [promoCodes] = await this.listPromoCodes()
    const promoList: any[] = Array.isArray(promoCodes) ? promoCodes : []
    return promoList.map((p) => ({
      code: p.codigo,
      value: p.valor,
      description: p.descripcion,
    }))
  }
}

export default TiendaDiscountService
