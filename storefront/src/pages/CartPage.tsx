import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="text-center py-16" data-testid="cart-page">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Carrito Vacio</h1>
        <p className="text-gray-500 mb-8">No tienes productos en tu carrito.</p>
        <Link to="/" className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition" data-testid="continue-shopping">
          Ver Productos
        </Link>
      </div>
    )
  }

  return (
    <div data-testid="cart-page">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Tu Carrito</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full" data-testid="cart-table">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Producto</th>
              <th className="text-center px-6 py-3 text-sm font-medium text-gray-600">Cantidad</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Precio Unit.</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Subtotal</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.product_id} className="border-t" data-testid={`cart-item-${item.product_id}`}>
                <td className="px-6 py-4 font-medium text-gray-800" data-testid={`cart-item-name-${item.product_id}`}>
                  {item.nombre}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100"
                      data-testid={`qty-decrease-${item.product_id}`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center" data-testid={`qty-value-${item.product_id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-8 h-8 rounded border text-gray-600 hover:bg-gray-100"
                      data-testid={`qty-increase-${item.product_id}`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPrice(item.precio)}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-800" data-testid={`cart-item-total-${item.product_id}`}>
                  {formatPrice(item.precio * item.quantity)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    data-testid={`remove-item-${item.product_id}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <p className="text-2xl font-bold text-gray-800" data-testid="cart-subtotal">
          Subtotal: {formatPrice(subtotal)}
        </p>
        <Link
          to="/checkout"
          className="bg-green-600 text-white py-3 px-8 rounded-md hover:bg-green-700 transition font-medium text-lg"
          data-testid="checkout-button"
        >
          Proceder al Checkout
        </Link>
      </div>
    </div>
  )
}
