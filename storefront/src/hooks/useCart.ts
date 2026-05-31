/**
 * Hook global de carrito de compras.
 * Usa localStorage para persistir entre recargas.
 * Todos los data-testid facilitan las pruebas E2E con Cypress/Selenium.
 */
import { useState, useEffect } from 'react'

export interface CartItem {
  product_id: string
  nombre: string
  precio: number
  quantity: number
}

const CART_KEY = 'tienda_demo_cart'

function loadCart(): CartItem[] {
  try {
    const data = localStorage.getItem(CART_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    saveCart(items)
  }, [items])

  const addItem = (product: { product_id: string; nombre: string; precio: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.product_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const subtotal = items.reduce((sum, i) => sum + i.precio * i.quantity, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, subtotal }
}
