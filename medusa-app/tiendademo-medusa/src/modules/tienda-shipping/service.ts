/**
 * Servicio de Envío - Tienda Demo (MedusaJS v2)
 *
 * REGLA DE NEGOCIO: El costo de envío depende de la distancia al cliente.
 *
 * TARIFAS:
 * - Distancia < 5 km: $5.000 pesos (Envío Express)
 * - Distancia entre 5 y 10 km: $10.000 pesos (Envío Estándar)
 * - Distancia > 10 km: RECHAZAR la compra
 *
 * CASOS DE PRUEBA SUGERIDOS:
 * - Distancia 0 km: $5.000
 * - Distancia 3 km: $5.000
 * - Distancia exacta 5 km: $10.000
 * - Distancia 7 km: $10.000
 * - Distancia exacta 10 km: $10.000
 * - Distancia 12 km: RECHAZADA
 * - Coordenadas inválidas (negativas): Calcular correctamente
 */
import { MedusaService } from "@medusajs/framework/utils"
import ShippingZone from "./models/shipping-zone"

class TiendaShippingService extends MedusaService({
  ShippingZone,
}) {
  /**
   * Tarifas de envío
   */
  static TARIFFS = {
    SHORT_DISTANCE: { maxDist: 5, price: 5000, name: "Envio Express" },
    MEDIUM_DISTANCE: { minDist: 5, maxDist: 10, price: 10000, name: "Envio Estandar" },
  }

  static MAX_DISTANCE = 10

  /**
   * Calcula distancia euclidiana desde el origen (0,0)
   */
  private calcDist(x: number, y: number): number {
    return Math.sqrt(x * x + y * y)
  }

  /**
   * Calcula el costo de envío basado en coordenadas o zona
   */
  async calculateShipping({ x, y, zone }: { x?: number; y?: number; zone?: string }) {
    let tx = x
    let ty = y

    // Si se proporciona zona, buscar coordenadas en la DB
    if (zone) {
      try {
        const [zones] = await this.listShippingZones({
          nombre: zone.toUpperCase(),
        })
        const zoneData = zones?.[0]

        if (!zoneData) {
          return {
            available: false,
            error: "ZONE_NOT_FOUND",
            message: `La zona "${zone}" no está definida`,
          }
        }

        tx = zoneData.x
        ty = zoneData.y
      } catch {
        return {
          available: false,
          error: "ZONE_NOT_FOUND",
          message: `La zona "${zone}" no está definida`,
        }
      }
    }

    if (tx === undefined || ty === undefined) {
      return {
        available: false,
        error: "MISSING_LOCATION",
        message: "Debe proporcionar coordenadas (x, y) o una zona válida",
      }
    }

    const dist = Math.round(this.calcDist(tx, ty) * 100) / 100
    const { SHORT_DISTANCE, MEDIUM_DISTANCE } = TiendaShippingService.TARIFFS

    if (dist < SHORT_DISTANCE.maxDist) {
      return {
        available: true,
        distance: dist,
        price: SHORT_DISTANCE.price,
        tariff: SHORT_DISTANCE.name,
        message: "Envio Express",
      }
    } else if (dist <= MEDIUM_DISTANCE.maxDist) {
      return {
        available: true,
        distance: dist,
        price: MEDIUM_DISTANCE.price,
        tariff: MEDIUM_DISTANCE.name,
        message: "Envio Estandar",
      }
    } else {
      return {
        available: false,
        distance: dist,
        price: 0,
        status: "rejected",
        message: `No se puede enviar a ${dist} km. Distancia máxima: ${TiendaShippingService.MAX_DISTANCE} km`,
      }
    }
  }

  /**
   * Obtiene todas las zonas de envío con información de disponibilidad
   */
  async getAvailableZones() {
    const [zones] = await this.listShippingZones()
    const zoneList: any[] = Array.isArray(zones) ? zones : []

    return zoneList.map((z) => {
      const dist = Math.round(this.calcDist(z.x, z.y) * 100) / 100
      return {
        zone: z.nombre,
        distance: dist,
        available: dist <= TiendaShippingService.MAX_DISTANCE,
      }
    })
  }

  /**
   * Obtiene las tarifas configuradas
   */
  getTariffs() {
    return {
      SHORT: TiendaShippingService.TARIFFS.SHORT_DISTANCE,
      MEDIUM: TiendaShippingService.TARIFFS.MEDIUM_DISTANCE,
      MAX_DISTANCE: TiendaShippingService.MAX_DISTANCE,
    }
  }
}

export default TiendaShippingService
