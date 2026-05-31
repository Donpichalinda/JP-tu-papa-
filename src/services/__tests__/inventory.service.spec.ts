import InventoryService from '../InventoryService';

describe('InventoryService - validateInventory / reserve / restore', () => {
  const products = new Map();
  products.set('p1', { id: 'p1', title: 'Prod 1', inventory_quantity: 5, price: 100 });
  products.set('p2', { id: 'p2', title: 'Prod 2', inventory_quantity: 0, price: 200 });

  const productModel = {
    findOne: async ({ where: { id } }) => {
      return products.get(id) || null;
    },
    save: async (p) => {
      products.set(p.id, p);
      return p;
    },
  };

  const svc = new InventoryService({ productModel, cartModel: {} });

  test('validateInventory con stock suficiente', async () => {
    const res = await svc.validateInventory([{ variant_id: 'p1', quantity: 2 }]);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.available_items[0].quantity).toBe(2);
  });

  test('validateInventory con stock insuficiente', async () => {
    const res = await svc.validateInventory([{ variant_id: 'p2', quantity: 1 }]);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0].error).toBe('INSUFFICIENT_STOCK');
  });

  test('reserveInventory reduce inventario y devuelve éxito', async () => {
    // asegurar stock disponible
    products.set('p1', { id: 'p1', title: 'Prod 1', inventory_quantity: 5, price: 100 });
    const res = await svc.reserveInventory([{ variant_id: 'p1', quantity: 3 }]);
    expect(res.success).toBe(true);
    expect(res.results[0].success).toBe(true);
    expect(products.get('p1').inventory_quantity).toBe(2);
  });
});
