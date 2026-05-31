import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

export default function Navbar() {
  const { items } = useCart()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="bg-white shadow-md" data-testid="navbar">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600" data-testid="nav-logo">
          Tienda Demo
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-gray-700 hover:text-blue-600 transition"
            data-testid="nav-products"
          >
            Productos
          </Link>
          <Link
            to="/cart"
            className="relative text-gray-700 hover:text-blue-600 transition"
            data-testid="nav-cart"
          >
            Carrito
            {totalItems > 0 && (
              <span
                className="absolute -top-2 -right-4 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                data-testid="cart-badge"
              >
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
