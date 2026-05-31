import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { api } from '../services/api'

const ZONES = ['CENTRO', 'NORTE', 'SUR', 'OCCIDENTE', 'ORIENTE']

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [zone, setZone] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<{ valid?: boolean; message?: string } | null>(null)
  const [shippingInfo, setShippingInfo] = useState<any>(null)
  const [discountInfo, setDiscountInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-calculate discount when page loads (auto-threshold for subtotal > $200,000)
  useEffect(() => {
    if (subtotal > 0) {
      api.calculateDiscount(subtotal).then((result) => {
        if (result.applies) {
          setDiscountInfo(result)
        }
      }).catch(() => { })
    }
  }, [subtotal])

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return
    setPromoStatus(null)
    try {
      const result = await api.validatePromoCode(promoCode)
      if (result.valid) {
        setPromoStatus({ valid: true, message: `Codigo "${result.code}" valido: ${result.value}% de descuento` })
        // Recalculate discount with promo code
        const discount = await api.calculateDiscount(subtotal, promoCode)
        setDiscountInfo(discount)
      } else {
        setPromoStatus({ valid: false, message: result.error === 'INVALID_CODE' ? 'Codigo invalido' : 'Codigo no disponible' })
        // Recalculate without promo (might still get auto-threshold)
        const discount = await api.calculateDiscount(subtotal)
        setDiscountInfo(discount.applies ? discount : null)
      }
    } catch {
      setPromoStatus({ valid: false, message: 'Error al validar codigo' })
    }
  }

  const handleRemovePromo = async () => {
    setPromoCode('')
    setPromoStatus(null)
    // Recalculate discount without promo code (auto-threshold might still apply)
    try {
      const discount = await api.calculateDiscount(subtotal)
      setDiscountInfo(discount.applies ? discount : null)
    } catch {
      setDiscountInfo(null)
    }
  }

  const handleZoneChange = async (selectedZone: string) => {
    setZone(selectedZone)
    setShippingInfo(null)
    if (!selectedZone) return
    try {
      const result = await api.calculateShipping(selectedZone)
      setShippingInfo(result)
    } catch {
      setShippingInfo({ available: false, message: 'Error al calcular envio' })
    }
  }

  const handlePlaceOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const orderItems = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
      const result = await api.createOrder(orderItems, promoCode || undefined, zone || undefined)

      if (result.success) {
        clearCart()
        // Store order data for confirmation page
        sessionStorage.setItem('last_order', JSON.stringify(result.data))
        navigate('/order-confirmation')
      } else {
        setError(result.error || 'Error al crear la orden')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16" data-testid="checkout-page">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Checkout</h1>
        <p className="text-gray-500">Tu carrito esta vacio.</p>
      </div>
    )
  }

  const shippingCost = shippingInfo?.available ? shippingInfo.price : 0
  const discountAmount = discountInfo?.discount_amount || 0
  const total = subtotal - discountAmount + shippingCost

  return (
    <div className="max-w-2xl mx-auto" data-testid="checkout-page">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      {/* Resumen de productos */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen del Pedido</h2>
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between py-2 border-b last:border-0" data-testid={`checkout-item-${item.product_id}`}>
            <span>{item.nombre} x{item.quantity}</span>
            <span className="font-medium">{formatPrice(item.precio * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-4 font-bold text-lg" data-testid="checkout-subtotal">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>

      {/* Descuento Automatico Notification */}
      {discountInfo?.auto_threshold_applies && !promoStatus?.valid && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6" data-testid="auto-discount-notice">
          🎉 ¡Descuento automatico del 10% aplicado! Tu compra supera los $200.000.
        </div>
      )}

      {/* Codigo Promocional */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Codigo Promocional</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Ingresa tu codigo (ej: DESCUENTO10)"
            className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="promo-code-input"
          />
          <button
            onClick={handleValidatePromo}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            data-testid="validate-promo-button"
          >
            Aplicar
          </button>
          {promoStatus?.valid && (
            <button
              onClick={handleRemovePromo}
              className="text-red-500 px-3 py-2 rounded-md hover:bg-red-50 transition text-sm"
              data-testid="remove-promo-button"
            >
              Quitar
            </button>
          )}
        </div>
        {promoStatus && (
          <p
            className={`mt-2 text-sm ${promoStatus.valid ? 'text-green-600' : 'text-red-600'}`}
            data-testid="promo-status-message"
          >
            {promoStatus.message}
          </p>
        )}
      </div>

      {/* Zona de Envio */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Zona de Envio</h2>
        <select
          value={zone}
          onChange={(e) => handleZoneChange(e.target.value)}
          className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="shipping-zone-select"
        >
          <option value="">Selecciona una zona</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
        {shippingInfo && (
          <div className="mt-3" data-testid="shipping-info">
            {shippingInfo.available ? (
              <p className="text-green-600" data-testid="shipping-available">
                {shippingInfo.tariff} - {formatPrice(shippingInfo.price)} (Distancia: {shippingInfo.distance} km)
              </p>
            ) : (
              <p className="text-red-600" data-testid="shipping-unavailable">
                {shippingInfo.status === 'rejected'
                  ? '❌ Envio no disponible: la distancia supera los 10 km'
                  : shippingInfo.message || 'Envio no disponible para esta zona'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resumen Final */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Total</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600" data-testid="discount-line">
              <span>Descuento ({discountInfo?.type === 'promo_code' ? `Codigo: ${discountInfo.code}` : 'Automatico 10%'})</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          {shippingInfo?.available && (
            <div className="flex justify-between text-gray-600" data-testid="shipping-cost-line">
              <span>Envio ({shippingInfo.tariff})</span>
              <span>{formatPrice(shippingInfo.price)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t" data-testid="checkout-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4" data-testid="order-error">
          {error}
        </div>
      )}

      {/* Boton Confirmar */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading || !zone || (shippingInfo && !shippingInfo.available)}
        className="w-full bg-green-600 text-white py-4 rounded-md hover:bg-green-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="place-order-button"
      >
        {loading ? 'Procesando...' : 'Confirmar Orden'}
      </button>
    </div>
  )
}
