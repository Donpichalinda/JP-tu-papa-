import { useState, useEffect } from 'react'
import { useCart } from '../hooks/useCart'
import { api } from '../services/api'
import type { Product } from '../services/api'

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)
}

export default function ProductsPage() {
  const { addItem } = useCart()
  const [added, setAdded] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProducts().then((data) => {
      setProducts(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleAdd = (product: Product) => {
    addItem({ product_id: product.product_id, nombre: product.nombre, precio: product.precio })
    setAdded(product.product_id)
    setTimeout(() => setAdded(null), 1500)
  }

  if (loading) {
    return (
      <div className="text-center py-16" data-testid="products-page">
        <p className="text-gray-500">Cargando productos...</p>
      </div>
    )
  }

  return (
    <div data-testid="products-page">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Nuestros Productos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.product_id}
            className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between"
            data-testid={`product-card-${product.product_id}`}
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2" data-testid={`product-name-${product.product_id}`}>
                {product.nombre}
              </h2>
              <p className="text-2xl font-bold text-blue-600 mb-2" data-testid={`product-price-${product.product_id}`}>
                {formatPrice(product.precio)}
              </p>
              <p className="text-sm text-gray-500 mb-4" data-testid={`product-stock-${product.product_id}`}>
                Stock disponible: {product.stock} unidades
              </p>
            </div>
            <button
              onClick={() => handleAdd(product)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition font-medium"
              data-testid={`add-to-cart-${product.product_id}`}
            >
              {added === product.product_id ? 'Agregado!' : 'Agregar al Carrito'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
