import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)
}

export default function OrderConfirmationPage() {
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    const data = sessionStorage.getItem('last_order')
    if (data) {
      setOrderData(JSON.parse(data))
    }
  }, [])

  if (!orderData) {
    return (
      <div className="text-center py-16" data-testid="order-confirmation-page">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">No hay orden</h1>
        <Link to="/" className="text-blue-600 hover:underline">Volver a la tienda</Link>
      </div>
    )
  }

  // El backend devuelve: { success: true, order: { id, created_at, items, summary: { subtotal, discount: { applies, type, code, amount }, subtotal_after_discount, shipping: { available, distance, price }, total } } }
  const order = orderData.order
  const summary = order?.summary

  const subtotal = summary?.subtotal || 0
  const discountAmount = summary?.discount?.amount || 0
  const discountApplies = summary?.discount?.applies || false
  const discountType = summary?.discount?.type
  const discountCode = summary?.discount?.code
  const shippingPrice = summary?.shipping?.price || 0
  const shippingAvailable = summary?.shipping?.available || false
  const shippingDistance = summary?.shipping?.distance
  const total = summary?.total || 0

  return (
    <div className="max-w-2xl mx-auto text-center" data-testid="order-confirmation-page">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-green-600 text-6xl mb-4">&#10003;</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="order-success-title">
          Orden Creada Exitosamente
        </h1>
        <p className="text-gray-500 mb-8" data-testid="order-id">
          ID: {order?.id || 'N/A'}
        </p>

        <div className="text-left space-y-4">
          {/* Items de la orden */}
          {order?.items && order.items.length > 0 && (
            <div className="border-t pt-4">
              <h2 className="font-semibold text-gray-800 mb-2">Productos</h2>
              <div className="space-y-1 text-sm">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.nombre} x{item.quantity}</span>
                    <span>{formatPrice(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen financiero */}
          <div className="border-t pt-4">
            <h2 className="font-semibold text-gray-800 mb-2">Resumen</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between" data-testid="confirmation-subtotal">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountApplies && discountAmount > 0 && (
                <div className="flex justify-between text-green-600" data-testid="confirmation-discount">
                  <span>Descuento ({discountType === 'promo_code' ? `Código: ${discountCode}` : 'Automático 10%'}):</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              {shippingAvailable && (
                <div className="flex justify-between" data-testid="confirmation-shipping">
                  <span>Envío ({shippingDistance} km):</span>
                  <span>{formatPrice(shippingPrice)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2" data-testid="confirmation-total">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-block mt-8 bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition"
          data-testid="back-to-store"
        >
          Volver a la Tienda
        </Link>
      </div>
    </div>
  )
}
