/**
 * Servicio de Envío - Tienda Demo
 *
 * Este servicio implementa la lógica de negocio para el cálculo de costos de envío.
 *
 * REGLA DE NEGOCIO: El costo de envío depende de la distancia al cliente.
 *
 * TARIFAS:
 * - Distancia < 5 km: $5.000 pesos
 * - Distancia entre 5 y 10 km: $10.000 pesos
 * - Distancia > 10 km: RECHAZAR la compra (mostrar error)
 *
 * NOTA: El sistema de coordenadas asume un punto de origen (la tienda) en (0, 0)
 * y calcula la distancia euclidiana hasta la ubicación del cliente.
 *
 * Lógica implementada:
 * 1. Recibir coordenadas (x, y) del cliente o nombre de zona
 * 2. Calcular la distancia euclidiana desde el punto de origen
 * 3. Aplicar la tarifa correspondiente según la distancia
 * 4. Si la distancia > 10 km, rechazar la orden
 *
 * CASOS DE PRUEBA SUGERIDOS:
 * - Distancia exacta 0 km: $5.000 de envío
 * - Distancia 3 km: $5.000 de envío
 * - Distancia exacta 5 km: $10.000 de envío
 * - Distancia 7 km: $10.000 de envío
 * - Distancia exacta 10 km: $10.000 de envío
 * - Distancia 12 km: RECHAZAR (distancia máxima excedida)
 * - Distancia muy lejana (50 km): RECHAZAR
 * - Coordenadas inválidas (negativas): Calcular correctamente (distancias son absolutas)
 * - Distancia exactamente en el umbral (4.99km vs 5km): Validar correcto
 */

import { BaseService } from "medusa-interactions";

class ShippingService extends BaseService {
  /**
   * Tarifas de envío por rango de distancia
   * Las tarifas están en pesos colombianos (COP)
   */
  static TARIFFS = {
    /**
     * Tarifa para distancias cortas (< 5 km)
     * Zona: Centro, Occidente, áreas cercanas a la tienda
     */
    SHORT_DISTANCE: {
      max_distance: 5,
      price: 5000,
      name: "Envío Express",
      description: "Entrega en 1-2 días hábiles",
    },

    /**
     * Tarifa para distancias medias (5-10 km)
     * Zona: Norte, Oriente, áreas suburbanas
     */
    MEDIUM_DISTANCE: {
      min_distance: 5,
      max_distance: 10,
      price: 10000,
      name: "Envío Estándar",
      description: "Entrega en 2-4 días hábiles",
    },
  };

  /**
   * Distancia máxima permitida para entregas
   * Si la distancia supera este valor, la orden es rechazada
   */
  static MAX_DELIVERY_DISTANCE = 10;

  /**
   * Precio de la tienda (punto de origen para cálculos)
   * En un sistema real, esto vendría de la configuración de la tienda
   */
  static STORE_LOCATION = {
    x: 0,
    y: 0,
    name: "Tienda Principal",
  };

  /**
   * Zonas predefinidas con ubicaciones de ejemplo
   * Facilita las pruebas y el uso desde el panel admin
   */
  static PREDEFINED_ZONES = {
    CENTRO: { x: 3, y: 2, distance: 3.6 },
    NORTE: { x: 6, y: 4, distance: 7.2 },
    SUR: { x: 10, y: 8, distance: 12.8 },
    OCCIDENTE: { x: 2, y: 0, distance: 2 },
    ORIENTE: { x: 7, y: 4, distance: 8.1 },
  };

  /**
   * Constructor del servicio
   * @param {Object} options - Dependencias inyectadas por Medusa
   */
  constructor(options) {
    super(options);
    this.shippingModel = options?.shippingModel;
    this.regionModel = options?.regionModel;
  }

  /**
   * Calcula el costo de envío basado en la distancia
   *
   * @param {Object} params - Parámetros de ubicación
   * @param {number} params.x - Coordenada X del cliente (opcional si se usa zone)
   * @param {number} params.y - Coordenada Y del cliente (opcional si se usa zone)
   * @param {string} params.zone - Nombre de zona predefinida (opcional)
   * @returns {Object} - Resultado del cálculo de envío
   *
   * @example
   * // Ejemplo 1: Usando coordenadas directas
   * const result1 = await shippingService.calculateShipping({
   *   x: 3,
   *   y: 4
   * });
   * // result1.distance = 5
   * // result1.price = 10000
   * // result1.status = "available"
   *
   * @example
   * // Ejemplo 2: Usando zona predefinida
   * const result2 = await shippingService.calculateShipping({
   *   zone: "NORTE"
   * });
   * // result2.distance = 7.2
   * // result2.price = 10000
   * // result2.status = "available"
   *
   * @example
   * // Ejemplo 3: Zona fuera de alcance
   * const result3 = await shippingService.calculateShipping({
   *   zone: "SUR"
   * });
   * // result3.distance = 12.8
   * // result3.status = "rejected"
   * // result3.error = "DISTANCE_EXCEEDED"
   */
  calculateShipping(params) {
    let { x, y, zone } = params || {};
    // Resultado por defecto (envío no disponible)
    const defaultResult = {
      available: false,
      distance: 0,
      price: 0,
      status: "rejected",
      error: null,
      message: "",
      tariff: null,
    };

    // Si se proporciona una zona, usar las coordenadas predefinidas
    if (zone) {
      const zoneData = ShippingService.PREDEFINED_ZONES[zone.toUpperCase()];

      if (!zoneData) {
        return {
          ...defaultResult,
          error: "ZONE_NOT_FOUND",
          message: `La zona "${zone}" no está definida. Zonas disponibles: ${Object.keys(ShippingService.PREDEFINED_ZONES).join(", ")}`,
        };
      }

      x = zoneData.x;
      y = zoneData.y;
    }

    // Validar que tenemos coordenadas válidas
    if (x === undefined || y === undefined) {
      return {
        ...defaultResult,
        error: "MISSING_LOCATION",
        message: "Debe proporcionar coordenadas (x, y) o una zona válida",
      };
    }

    // Calcular la distancia euclidiana desde la tienda hasta el cliente
    // Fórmula: sqrt((x2-x1)^2 + (y2-y1)^2)
    const distance = this.calculateDistance(
      ShippingService.STORE_LOCATION.x,
      ShippingService.STORE_LOCATION.y,
      x,
      y
    );

    // Redondear a 2 decimales para evitar errores de punto flotante
    const roundedDistance = Math.round(distance * 100) / 100;

    /**
     * Determinar el precio basado en la distancia
     *
     * Lógica:
     * - Si distance < 5 km: Tarifa corta ($5.000)
     * - Si 5 <= distance <= 10 km: Tarifa media ($10.000)
     * - Si distance > 10 km: RECHAZAR
     */
    let tariff;
    let status;
    let error;
    let message;

    if (roundedDistance < ShippingService.TARIFFS.SHORT_DISTANCE.max_distance) {
      // Distancia < 5 km
      tariff = ShippingService.TARIFFS.SHORT_DISTANCE;
      status = "available";
      error = null;
      message = `Envío disponible a ${roundedDistance} km: ${tariff.name}`;
    } else if (
      roundedDistance >=
        ShippingService.TARIFFS.MEDIUM_DISTANCE.min_distance &&
      roundedDistance <= ShippingService.TARIFFS.MEDIUM_DISTANCE.max_distance
    ) {
      // Distancia entre 5 y 10 km
      tariff = ShippingService.TARIFFS.MEDIUM_DISTANCE;
      status = "available";
      error = null;
      message = `Envío disponible a ${roundedDistance} km: ${tariff.name}`;
    } else {
      // Distancia > 10 km - RECHAZAR
      status = "rejected";
      error = "DISTANCE_EXCEEDED";
      message = `Lo sentimos, no podemos realizar envíos a ${roundedDistance} km de distancia. La distancia máxima de entrega es de ${ShippingService.MAX_DELIVERY_DISTANCE} km.`;
    }

    return {
      available: status === "available",
      distance: roundedDistance,
      price: tariff?.price || 0,
      status,
      error,
      message,
      tariff: tariff || null,
      zone: zone || null,
      origin: ShippingService.STORE_LOCATION,
      destination: { x, y },
    };
  }

  /**
   * Calcula la distancia euclidiana entre dos puntos
   *
   * @param {number} x1 - Coordenada X del punto 1
   * @param {number} y1 - Coordenada Y del punto 1
   * @param {number} x2 - Coordenada X del punto 2
   * @param {number} y2 - Coordenada Y del punto 2
   * @returns {number} - Distancia euclidiana entre los puntos
   */
  calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Obtiene las zonas de envío disponibles
   * Útil para el panel de administración y para pruebas
   *
   * @returns {Array} - Lista de zonas con información de envío
   */
  getAvailableZones() {
    return Object.entries(ShippingService.PREDEFINED_ZONES).map(
      ([zoneName, data]) => {
        const shippingCalc = this.calculateShipping({ zone: zoneName });

        return {
          zone: zoneName,
          coordinates: { x: data.x, y: data.y },
          distance_km: data.distance,
          available: shippingCalc.available,
          price: shippingCalc.price,
          tariff_name: shippingCalc.tariff?.name || "No disponible",
        };
      }
    );
  }

  /**
   * Obtiene las tarifas de envío definidas
   *
   * @returns {Object} - Información de todas las tarifas
   */
  getTariffs() {
    return {
      short_distance: {
        ...ShippingService.TARIFFS.SHORT_DISTANCE,
        price_formatted: `$${ShippingService.TARIFFS.SHORT_DISTANCE.price.toLocaleString()}`,
      },
      medium_distance: {
        ...ShippingService.TARIFFS.MEDIUM_DISTANCE,
        price_formatted: `$${ShippingService.TARIFFS.MEDIUM_DISTANCE.price.toLocaleString()}`,
      },
      max_distance: ShippingService.MAX_DELIVERY_DISTANCE,
    };
  }
}

export default ShippingService;
